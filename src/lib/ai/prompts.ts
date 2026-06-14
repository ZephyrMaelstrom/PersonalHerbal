import type { Species } from '@/lib/storage';
import { labelFor } from '@/lib/vocab';

/** Prompt templates the user can pick from on the generate screen. */
export const PROMPT_TEMPLATES = [
  { code: 'standard', label: 'Standard monograph', emphasis: 'a balanced, encyclopedic overview' },
  { code: 'foraging', label: 'Foraging & identification', emphasis: 'field identification, lookalikes, edibility, and harvest timing' },
  { code: 'materia_medica', label: 'Materia medica', emphasis: 'medicinal actions, constituents, preparations, and clinical use' },
  { code: 'safety', label: 'Safety & contraindications', emphasis: 'toxicity, contraindications, drug interactions, and cautions' },
] as const;

/** Bump when the prompt structure changes so stored versions record which prompt made them. */
export const PROMPT_SCHEMA_VERSION = 'v1';

export function templateLabel(code: string): string {
  return PROMPT_TEMPLATES.find((t) => t.code === code)?.label ?? code;
}

const SCHEMA_DESCRIPTION = `Return ONLY a single JSON object (no markdown, no prose, no code fences) with exactly these keys:
{
  "summary": string,                       // 2-4 sentence overview
  "taxonomy": string,                      // family, genus, order as prose
  "synonyms": string[],                    // botanical synonyms / other scientific names
  "nativeRange": string,
  "habitat": string,
  "identifyingFeatures": string[],         // distinct, checkable field marks
  "lookalikes": { "name": string, "distinction": string }[],
  "edibility": string,
  "medicinalActions": string[],            // herbal actions
  "constituents": string[],                // notable phytochemical constituents
  "preparations": string[],                // typical preparations / uses
  "contraindications": string[],
  "drugInteractions": string[],
  "harvestWindows": string,
  "propagation": string,
  "citations": { "title": string, "url"?: string }[]
}
Every array must be present (use [] if nothing applies). Do not invent citations: include a citation only when you are confident the source exists; prefer authoritative botanical/herbal references. If you cannot cite anything, return an empty citations array.`;

export function buildSystemPrompt(): string {
  return [
    'You are a careful botanist and clinical herbalist writing a reference monograph for a single plant species.',
    'Be accurate and conservative. Distinguish well-established facts from traditional or anecdotal use.',
    'Never fabricate citations or constituents. When uncertain, say so plainly in the relevant field rather than guessing.',
    'This monograph is reference material only and is not medical advice.',
    SCHEMA_DESCRIPTION,
  ].join('\n\n');
}

export interface BuildUserPromptArgs {
  species: Species;
  region: string;
  templateCode: string;
  citationDepth: number;
  includeAttributes: boolean;
}

export function buildUserPrompt({
  species,
  region,
  templateCode,
  citationDepth,
  includeAttributes,
}: BuildUserPromptArgs): string {
  const tmpl = PROMPT_TEMPLATES.find((t) => t.code === templateCode) ?? PROMPT_TEMPLATES[0];
  const lines: string[] = [];

  lines.push(`Write a reference monograph for: ${species.scientificName}`);
  if (species.commonNames.length) lines.push(`Common names: ${species.commonNames.join(', ')}`);
  if (species.family) lines.push(`Family (as recorded): ${species.family}`);
  if (region.trim()) lines.push(`Region of interest: ${region.trim()} — tailor habitat, range, and harvest timing to this region where relevant.`);
  lines.push(`Emphasis: focus on ${tmpl.emphasis}.`);
  lines.push(`Aim for roughly ${citationDepth} citation(s) if reliable sources exist (fewer is fine; never fabricate).`);

  if (includeAttributes) {
    // Spec: send only structured attributes the user has recorded — never free-text notes
    // or photos. These are controlled-vocabulary facts, not the private notes layer.
    const attrs: string[] = [];
    if (species.edibility) attrs.push(`edibility: ${labelFor('edibility', species.edibility)}`);
    if (species.habitats.length) attrs.push(`habitats: ${species.habitats.map((h) => labelFor('habitat', h)).join(', ')}`);
    if (species.actions.length) attrs.push(`recorded actions: ${species.actions.map((a) => labelFor('action', a)).join(', ')}`);
    if (species.safetyFlags.length) attrs.push(`safety flags: ${species.safetyFlags.map((f) => labelFor('safety_flag', f)).join(', ')}`);
    if (attrs.length) {
      lines.push(`The grower has recorded these structured attributes; treat them as hints, verify independently, and do not simply echo them: ${attrs.join('; ')}.`);
    }
  }

  return lines.join('\n');
}
