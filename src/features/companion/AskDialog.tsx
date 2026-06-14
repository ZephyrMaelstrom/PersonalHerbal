import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { chat, type ChatMessage } from '@/lib/ai/chat';
import type { Species } from '@/lib/storage';
import { useSettings } from '@/features/settings/hooks';
import { useCurrentReference } from '@/features/reference/hooks';
import { asReferenceContent } from '@/features/reference/ReferenceView';

export function AskDialog({ species }: { species: Species }) {
  const { data: settings } = useSettings();
  const { data: current } = useCurrentReference(species.id);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const hasKey = !!settings?.apiKey.trim();

  function systemPrompt(): string {
    const ref = current ? asReferenceContent(current.content) : null;
    const parts = [
      `You are a careful, knowledgeable herbalist and botanist answering a practitioner's questions about ${species.scientificName}${species.commonNames.length ? ` (${species.commonNames.join(', ')})` : ''}.`,
      'Be accurate and concise. Flag uncertainty honestly, note relevant safety, contraindications, and drug interactions, and remind that this is reference information, not medical advice.',
    ];
    if (settings?.region.trim()) parts.push(`The practitioner's region is ${settings.region.trim()}.`);
    if (ref) {
      parts.push(
        `For context, here is the saved reference summary (you may go beyond it): ${ref.summary} Edibility: ${ref.edibility}. Contraindications: ${ref.contraindications.join('; ') || 'none recorded'}.`,
      );
    }
    return parts.join('\n');
  }

  async function send() {
    const q = input.trim();
    if (!q || busy || !settings) return;
    setError(undefined);
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const answer = await chat(settings, systemPrompt(), next);
      setMessages([...next, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle /> Ask
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col">
        <DialogHeader>
          <DialogTitle>Ask about {species.scientificName}</DialogTitle>
        </DialogHeader>

        {!hasKey ? (
          <p className="text-sm text-muted-foreground">
            Add your AI key in{' '}
            <Link to="/settings" className="text-primary underline" onClick={() => setOpen(false)}>
              Settings
            </Link>{' '}
            to ask questions.
          </p>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Ask anything — identification, preparations, dosing considerations, look-alikes, safety…
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm leading-relaxed',
                    m.role === 'user' ? 'ml-6 bg-primary/10' : 'mr-6 whitespace-pre-wrap bg-muted',
                  )}
                >
                  {m.content}
                </div>
              ))}
              {busy && <p className="text-xs text-muted-foreground">Thinking…</p>}
              {error && <p className="text-xs text-destructive-foreground/90">{error}</p>}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Your question…" disabled={busy} />
              <Button type="submit" size="icon" disabled={busy || !input.trim()}>
                <Send />
              </Button>
            </form>
            <p className="text-[11px] text-muted-foreground">Reference information, not medical advice.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
