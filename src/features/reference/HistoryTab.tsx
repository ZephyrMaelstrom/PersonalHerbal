import { useMemo, useState } from 'react';
import { Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { templateLabel } from '@/lib/ai/prompts';
import type { SpeciesReference } from '@/lib/storage';
import { useReferenceVersions, useSetCurrentReference } from './hooks';
import { ReferenceView, asReferenceContent } from './ReferenceView';

export function HistoryTab({ speciesId }: { speciesId: string }) {
  const { data: versions = [], isLoading } = useReferenceVersions(speciesId);
  const setCurrent = useSetCurrentReference(speciesId);
  const [viewing, setViewing] = useState<SpeciesReference | null>(null);

  const ordered = useMemo(() => [...versions].sort((a, b) => b.version - a.version), [versions]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading history…</p>;

  if (ordered.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No reference versions yet. Generate one from the Reference tab.
        </CardContent>
      </Card>
    );
  }

  const viewingContent = viewing ? asReferenceContent(viewing.content) : null;

  return (
    <div className="space-y-2">
      {ordered.map((v) => (
        <Card key={v.id}>
          <CardContent className="space-y-2 p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">v{v.version}</span>
              {v.isCurrent && <Badge>Current</Badge>}
              {!v.citationsPresent && <Badge variant="warning">Unsourced</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {v.model} · {templateLabel(v.promptVersion.split(':')[1] ?? '')} ·{' '}
              {new Date(v.generatedAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setViewing(v)}>
                <Eye /> View
              </Button>
              {!v.isCurrent && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setCurrent.isPending}
                  onClick={() => setCurrent.mutate(v.id)}
                >
                  <Check /> Make current
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reference v{viewing?.version}</DialogTitle>
          </DialogHeader>
          {viewingContent ? (
            <ReferenceView content={viewingContent} />
          ) : (
            <p className="text-sm text-muted-foreground">Content could not be displayed.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
