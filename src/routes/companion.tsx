import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chat } from '@/lib/ai/chat';
import { labelFor } from '@/lib/vocab';
import { isInSeason } from '@/lib/season';
import { useSpeciesList } from '@/features/species/hooks';
import { useSettings } from '@/features/settings/hooks';

const SYSTEM =
  'You are a seasoned herbalist companion for a single practitioner. Be concrete, concise, and practical. ' +
  'Suggest things grounded in the collection and season provided. Always flag safety, contraindications, and ' +
  'look-alike risks where relevant. This is reference guidance, not medical advice.';

export function CompanionScreen() {
  const { data: settings } = useSettings();
  const { data: species = [] } = useSpeciesList();
  const [answer, setAnswer] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [custom, setCustom] = useState('');

  const hasKey = !!settings?.apiKey.trim();

  const context = useMemo(() => {
    const inSeason = species.filter((s) => s.harvestSeasons.length && isInSeason(s.harvestSeasons)).map((s) => s.scientificName);
    const names = species.slice(0, 50).map((s) => s.scientificName);
    const flagged = species
      .filter((s) => s.safetyFlags.length)
      .slice(0, 30)
      .map((s) => `${s.scientificName} (${s.safetyFlags.map((f) => labelFor('safety_flag', f)).join(', ')})`);
    return { inSeason, names, flagged };
  }, [species]);

  async function run(question: string) {
    if (!settings) return;
    setBusy(true);
    setError(undefined);
    setAnswer(undefined);
    const region = settings.region.trim() ? `Region: ${settings.region.trim()}.` : '';
    const ctx = [
      region,
      `Collection (${species.length} species): ${context.names.join(', ') || 'none yet'}.`,
      `In season now: ${context.inSeason.join(', ') || 'none recorded'}.`,
      context.flagged.length ? `Species with safety flags: ${context.flagged.join('; ')}.` : '',
      '',
      question,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      setAnswer(await chat(settings, SYSTEM, [{ role: 'user', content: ctx }], 1400));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  }

  const presets = [
    { label: 'What to harvest now', q: 'Based on what is in season in my region and my collection, what should I focus on harvesting or foraging right now, and why?' },
    { label: 'What can I make', q: 'Given my collection, suggest 3–5 preparations I could make now, with the plant part, method, and a one-line rationale each.' },
    { label: 'Safety review', q: 'Review my collection for notable safety concerns, contraindications, and dangerous look-alikes I should keep in mind.' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Herbalist companion</h1>

      {!hasKey ? (
        <Card>
          <CardContent className="space-y-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">Add your AI key to use the companion.</p>
            <Button asChild variant="outline">
              <Link to="/settings">Open Settings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <Button key={p.label} variant="outline" size="sm" disabled={busy} onClick={() => run(p.q)}>
                {p.label}
              </Button>
            ))}
          </div>

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) run(custom.trim());
            }}
          >
            <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or ask your own…" disabled={busy} />
            <Button type="submit" disabled={busy || !custom.trim()}>
              <Sparkles /> Ask
            </Button>
          </form>

          {busy && <p className="text-sm text-muted-foreground">Thinking…</p>}
          {error && <p className="text-sm text-destructive-foreground/90">{error}</p>}
          {answer && (
            <Card>
              <CardContent className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{answer}</CardContent>
            </Card>
          )}
          <p className="text-[11px] text-muted-foreground">Reference guidance, not medical advice.</p>
        </>
      )}
    </div>
  );
}
