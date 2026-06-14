import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Photo } from '@/lib/storage';
import { PhotoImg } from './PhotoImg';
import { PhotoCapture } from './PhotoCapture';
import { processImage } from './image';
import { useAddPhoto, useDeletePhoto, useSpeciesPhotos } from './hooks';

export function PhotosTab({ speciesId }: { speciesId: string }) {
  const { data: photos = [], isLoading } = useSpeciesPhotos(speciesId);
  const add = useAddPhoto(speciesId);
  const del = useDeletePhoto(speciesId);
  const [active, setActive] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: File[]) {
    setBusy(true);
    try {
      for (const file of files) {
        const { blob, mime } = await processImage(file);
        await add.mutateAsync({ speciesId, blob, mime });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PhotoCapture onFiles={handleFiles} disabled={busy} />
      {busy && <p className="text-xs text-muted-foreground">Adding photo…</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading photos…</p>
      ) : photos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No photos yet. Take one or add from your library.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p)}
              className="aspect-square overflow-hidden rounded-md border bg-muted"
            >
              <PhotoImg blob={p.blob} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {active && <PhotoImg blob={active.blob} className="max-h-[60vh] w-full rounded-md object-contain" />}
          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              className="text-destructive-foreground/80"
              onClick={() => {
                if (active) del.mutate(active.id);
                setActive(null);
              }}
            >
              <Trash2 /> Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
