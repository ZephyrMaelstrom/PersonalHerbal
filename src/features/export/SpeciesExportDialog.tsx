import { useState } from 'react';
import { FileText, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SPECIES_FORMATS } from '@/lib/export/species';
import { deliver, printHtml } from '@/lib/export/share';
import { useToast } from '@/components/ui/toast';

export function SpeciesExportDialog({ speciesId }: { speciesId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string>();
  const { toast } = useToast();

  async function run(id: string) {
    const fmt = SPECIES_FORMATS.find((f) => f.id === id);
    if (!fmt) return;
    setBusy(id);
    try {
      const artifact = await fmt.build(speciesId);
      if (!artifact) {
        toast({ message: 'Nothing to export yet.' });
        return;
      }
      if (fmt.kind === 'print') {
        printHtml(typeof artifact.content === 'string' ? artifact.content : '');
      } else {
        await deliver(artifact);
      }
      setOpen(false);
    } catch {
      toast({ message: 'Export failed.' });
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Share or export">
          <Share2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share / export</DialogTitle>
          <DialogDescription>A shareable monograph for outreach. More formats coming over time.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {SPECIES_FORMATS.map((f) => (
            <Button key={f.id} variant="outline" className="justify-start" disabled={!!busy} onClick={() => run(f.id)}>
              {f.kind === 'print' ? <Printer /> : <FileText />}
              {busy === f.id ? 'Preparing…' : f.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
