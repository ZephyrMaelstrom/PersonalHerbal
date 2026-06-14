import { useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { Photo } from '@/lib/storage';
import { useSpecies, useUpdateSpecies } from '@/features/species/hooks';
import { PhotoImg } from './PhotoImg';
import { PhotoCapture } from './PhotoCapture';
import { processImage } from './image';
import { useAddPhoto, useDeletePhoto, useSpeciesPhotos } from './hooks';

export function PhotosTab({ speciesId }: { speciesId: string }) {
  const { data: photos = [], isLoading } = useSpeciesPhotos(speciesId);
  const { data: species } = useSpecies(speciesId);
  const updateSpecies = useUpdateSpecies(speciesId);
  const add = useAddPhoto(speciesId);
  const del = useDeletePhoto(speciesId);
  const { toast } = useToast();
  const [active, setActive] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);

  const mainPhotoId = species?.mainPhotoId;

  async function handleFiles(files: File[]) {
    setBusy(true);
    try {
      let firstAddedId: string | undefined;
      for (const file of files) {
        const { blob, mime } = await processImage(file);
        const photo = await add.mutateAsync({ speciesId, blob, mime });
        firstAddedId ??= photo.id;
      }
      // The first photo a species gets becomes its main photo automatically.
      if (firstAddedId && !mainPhotoId) {
        await updateSpecies.mutateAsync({ mainPhotoId: firstAddedId });
      }
    } finally {
      setBusy(false);
    }
  }

  async function setMain(id: string) {
    await updateSpecies.mutateAsync({ mainPhotoId: id });
    setActive(null);
  }

  async function remove(photo: Photo) {
    setActive(null);
    await del.mutateAsync(photo.id);
    if (mainPhotoId === photo.id) {
      const next = photos.find((p) => p.id !== photo.id);
      await updateSpecies.mutateAsync({ mainPhotoId: next?.id });
    }
    toast({
      message: 'Photo deleted',
      actionLabel: 'Undo',
      onAction: async () => {
        const restored = await add.mutateAsync({
          speciesId,
          blob: photo.blob,
          mime: photo.mime,
          caption: photo.caption,
          sightingId: photo.sightingId,
        });
        if (mainPhotoId === photo.id) await updateSpecies.mutateAsync({ mainPhotoId: restored.id });
      },
    });
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
            No photos yet. Take one or add from your library — the first becomes the main photo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md border bg-muted',
                p.id === mainPhotoId && 'ring-2 ring-primary',
              )}
            >
              <PhotoImg blob={p.blob} className="h-full w-full object-cover" />
              {p.id === mainPhotoId && (
                <span className="absolute left-1 top-1 rounded-full bg-background/90 p-1">
                  <Star className="size-3 fill-primary text-primary" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo</DialogTitle>
          </DialogHeader>
          {active && <PhotoImg blob={active.blob} className="max-h-[55vh] w-full rounded-md object-contain" />}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {active && active.id === mainPhotoId ? (
              <Badge>
                <Star className="mr-1 size-3 fill-current" /> Main photo
              </Badge>
            ) : (
              <Button variant="outline" onClick={() => active && setMain(active.id)}>
                <Star /> Set as main
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="text-destructive-foreground/80" onClick={() => active && remove(active)}>
                <Trash2 /> Delete
              </Button>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
