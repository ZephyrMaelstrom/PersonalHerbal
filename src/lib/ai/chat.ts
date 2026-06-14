import Anthropic from '@anthropic-ai/sdk';
import type { AppSettings } from '@/lib/settings';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * One-shot chat completion against Claude, reused by the "ask about this plant" and
 * seasonal-companion features. The key is the user's own, stored locally; calls happen only
 * on explicit user action.
 */
export async function chat(
  settings: AppSettings,
  system: string,
  messages: ChatMessage[],
  maxTokens = 1024,
): Promise<string> {
  if (!settings.apiKey.trim()) {
    throw new Error('Add your Anthropic API key in Settings first.');
  }
  const client = new Anthropic({ apiKey: settings.apiKey.trim(), dangerouslyAllowBrowser: true });
  const message = await client.messages.create({
    model: settings.model,
    max_tokens: maxTokens,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}
