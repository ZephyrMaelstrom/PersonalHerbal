import Anthropic from '@anthropic-ai/sdk';
import type { Species } from '@/lib/storage';
import type { AppSettings } from '@/lib/settings';
import { referenceContentSchema, type ReferenceContent } from './schema';
import {
  buildSystemPrompt,
  buildUserPrompt,
  PROMPT_SCHEMA_VERSION,
  type BuildUserPromptArgs,
} from './prompts';

export interface GenerateResult {
  content: ReferenceContent;
  model: string;
  promptVersion: string;
  contentHash: string;
}

export interface GenerateArgs extends Omit<BuildUserPromptArgs, 'species'> {
  species: Species;
}

/** SHA-256 of the canonical content JSON, per the spec's `content_hash` requirement. */
async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Pull the first JSON object out of a model response (tolerates stray prose/fences). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response.');
  return JSON.parse(candidate.slice(start, end + 1));
}

/**
 * Generate a reference monograph via Claude. Validates the JSON against the Zod schema and
 * retries once on validation failure before throwing (per spec). Returns the structured
 * content plus the metadata stored on each immutable version row.
 */
export async function generateReference(
  settings: AppSettings,
  args: GenerateArgs,
): Promise<GenerateResult> {
  if (!settings.apiKey.trim()) {
    throw new Error('Add your Anthropic API key in Settings before generating.');
  }

  const client = new Anthropic({ apiKey: settings.apiKey.trim(), dangerouslyAllowBrowser: true });
  const system = buildSystemPrompt();
  const baseUser = buildUserPrompt({ ...args });

  let lastError = 'Unknown error';
  for (let attempt = 0; attempt < 2; attempt++) {
    const user =
      attempt === 0
        ? baseUser
        : `${baseUser}\n\nYour previous reply did not parse as the required JSON object. Reply with ONLY the JSON object, nothing else.`;

    const message = await client.messages.create({
      model: settings.model,
      max_tokens: 8192,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    try {
      const parsed = referenceContentSchema.safeParse(extractJson(text));
      if (parsed.success) {
        const canonical = JSON.stringify(parsed.data);
        return {
          content: parsed.data,
          model: settings.model,
          promptVersion: `${PROMPT_SCHEMA_VERSION}:${args.templateCode}`,
          contentHash: await sha256(canonical),
        };
      }
      lastError = 'The response did not match the expected reference structure.';
    } catch (e) {
      lastError = e instanceof Error ? e.message : 'Failed to parse the response.';
    }
  }

  throw new Error(`Could not generate a valid reference: ${lastError}`);
}
