import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Field } from '@/components/inputs/Field';
import { cn } from '@/lib/utils';
import { AI_MODELS } from '@/lib/settings';
import { PROMPT_TEMPLATES } from '@/lib/ai/prompts';
import { generateReference, type GenerateResult } from '@/lib/ai/generate';
import { useSpecies } from '@/features/species/hooks';
import { useSettings } from '@/features/settings/hooks';
import { useCreateReference, useCurrentReference } from '@/features/reference/hooks';
import { ReferenceView, asReferenceContent } from '@/features/reference/ReferenceView';
import type { ReferenceContent } from '@/lib/ai/schema';

const FIELD_LABELS: Record<keyof ReferenceContent, string> = {
  summary: 'Summary',
  taxonomy: 'Taxonomy',
  synonyms: 'Synonyms',
  nativeRange: 'Native range',
  habitat: 'Habitat',
  identifyingFeatures: 'Identifying features',
  lookalikes: 'Lookalikes',
  edibility: 'Edibility',
  medicinalActions: 'Medicinal actions',
  constituents: 'Constituents',
  preparations: 'Preparations',
  contraindications: 'Contraindications',
  drugInteractions: 'Drug interactions',
  harvestWindows: 'Harvest windows',
  propagation: 'Propagation',
  citations: 'Citations',
};

function changedFields(a: ReferenceContent, b: ReferenceContent): string[] {
  return (Object.keys(FIELD_LABELS) as (keyof ReferenceContent)[])
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => FIELD_LABELS[k]);
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1.5 text-sm transition-colors',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-input text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function ReferenceGenerateScreen() {
  const { speciesId } = useParams({ strict: false }) as { speciesId: string };
  const navigate = useNavigate();
  const { data: species } = useSpecies(speciesId);
  const { data: settings } = useSettings();
  const { data: current } = useCurrentReference(speciesId);
  const createRef = useCreateReference(speciesId);

  const [model, setModel] = useState<string>();
  const [template, setTemplate] = useState('standard');
  const [region, setRegion] = useState<string>();
  const [citationDepth, setCitationDepth] = useState(5);
  const [includeAttributes, setIncludeAttributes] = useState(false);

  const [phase, setPhase] = useState<'form' | 'generating' | 'preview'>('form');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string>();

  if (!species || !settings) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const effectiveModel = model ?? settings.model;
  const effectiveRegion = region ?? settings.region;
  const hasKey = settings.apiKey.trim().length > 0;

  async function generate() {
    if (!species) return;
    setError(undefined);
    setPhase('generating');
    try {
      const res = await generateReference(settings!, {
        species,
        region: effectiveRegion,
        templateCode: template,
        citationDepth,
        includeAttributes,
      });
      setResult({ ...res, model: effectiveModel });
      setPhase('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.');
      setPhase('form');
    }
  }

  async function save() {
    if (!result) return;
    await createRef.mutateAsync({
      speciesId,
      model: result.model,
      promptVersion: result.promptVersion,
      contentHash: result.contentHash,
      content: result.content as unknown as Record<string, unknown>,
      citationsPresent: result.content.citations.length > 0,
    });
    navigate({ to: '/species/$speciesId', params: { speciesId } });
  }

  const currentContent = current ? asReferenceContent(current.content) : null;
  const diff = result && currentContent ? changedFields(currentContent, result.content) : null;

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/species/$speciesId" params={{ speciesId }}>
          <ArrowLeft /> Back to species
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Generate reference</h1>
        <p className="text-sm italic text-muted-foreground">{species.scientificName}</p>
      </div>

      {!hasKey && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-muted-foreground">
            No API key set. Add your Anthropic key in{' '}
            <Link to="/settings" className="text-primary underline">
              Settings
            </Link>{' '}
            to generate.
          </p>
        </div>
      )}

      {phase !== 'preview' && (
        <div className="space-y-4">
          <Field label="Model">
            <div className="flex flex-wrap gap-2">
              {AI_MODELS.map((m) => (
                <Choice key={m.code} active={effectiveModel === m.code} onClick={() => setModel(m.code)}>
                  {m.label}
                </Choice>
              ))}
            </div>
          </Field>

          <Field label="Prompt template">
            <div className="flex flex-wrap gap-2">
              {PROMPT_TEMPLATES.map((t) => (
                <Choice key={t.code} active={template === t.code} onClick={() => setTemplate(t.code)}>
                  {t.label}
                </Choice>
              ))}
            </div>
          </Field>

          <Field label="Region context" hint="Defaults to your Settings region. Tailors range, habitat, and timing.">
            <Input
              value={effectiveRegion}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. Upper Midwest, USA"
            />
          </Field>

          <Field label={`Citation depth: aim for ~${citationDepth}`}>
            <input
              type="range"
              min={0}
              max={12}
              value={citationDepth}
              onChange={(e) => setCitationDepth(+e.target.value)}
              className="w-full accent-primary"
            />
          </Field>

          <Field label="Notes context">
            <Choice active={includeAttributes} onClick={() => setIncludeAttributes((v) => !v)}>
              {includeAttributes ? '✓ ' : ''}Send my structured attributes (habitat, actions…)
            </Choice>
            <p className="mt-1 text-xs text-muted-foreground">
              Off by default. Sends only controlled-vocabulary attributes — never your private notes or photos.
            </p>
          </Field>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive-foreground" />
              <p className="text-xs text-destructive-foreground/90">{error}</p>
            </div>
          )}

          <Button className="w-full" disabled={!hasKey || phase === 'generating'} onClick={generate}>
            <Sparkles /> {phase === 'generating' ? 'Generating… (this can take a moment)' : 'Generate'}
          </Button>
        </div>
      )}

      {phase === 'preview' && result && (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium">Preview — review before saving</p>
              <p className="text-xs text-muted-foreground">
                Saving creates v{(current?.version ?? 0) + 1} and makes it current. Previous versions stay in History.
              </p>
              {result.content.citations.length === 0 && (
                <p className="text-xs text-yellow-400">⚠ No citations — this version will be marked unsourced.</p>
              )}
              {diff && (
                <p className="text-xs text-muted-foreground">
                  {diff.length === 0
                    ? 'No changes vs current version.'
                    : `Changed vs current: ${diff.join(', ')}.`}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Button onClick={save} disabled={createRef.isPending}>
                  {createRef.isPending ? 'Saving…' : 'Save as new version'}
                </Button>
                <Button variant="outline" onClick={() => setPhase('form')}>
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>

          <ReferenceView content={result.content} />
        </div>
      )}
    </div>
  );
}
