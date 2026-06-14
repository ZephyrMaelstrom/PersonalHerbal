import { Link } from '@tanstack/react-router';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { templateLabel } from '@/lib/ai/prompts';
import { useCurrentReference } from './hooks';
import { ReferenceView, asReferenceContent } from './ReferenceView';

export function ReferenceTab({ speciesId }: { speciesId: string }) {
  const { data: current, isLoading } = useCurrentReference(speciesId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading reference…</p>;

  if (!current) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-muted-foreground">
            No reference page generated yet. The reference layer is AI-generated, versioned, and read-only here.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/species/$speciesId/reference" params={{ speciesId }} search={{ improve: false }}>
            <Sparkles /> Generate reference page
          </Link>
        </Button>
      </div>
    );
  }

  const content = asReferenceContent(current.content);

  return (
    <div className="space-y-4">
      {!current.citationsPresent && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-yellow-400" />
          <p className="text-xs text-muted-foreground">
            This version is <strong>unsourced</strong> — the model did not provide citations. Treat it with extra caution.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          v{current.version} · {current.model} · {templateLabel(current.promptVersion.split(':')[1] ?? '')} ·{' '}
          {new Date(current.generatedAt).toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/species/$speciesId/reference" params={{ speciesId }} search={{ improve: true }}>
              <Sparkles /> Improve
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/species/$speciesId/reference" params={{ speciesId }} search={{ improve: false }}>
              <RefreshCw /> Regenerate
            </Link>
          </Button>
        </div>
      </div>

      {content ? (
        <ReferenceView content={content} />
      ) : (
        <p className="text-sm text-muted-foreground">This version's content could not be displayed.</p>
      )}
    </div>
  );
}
