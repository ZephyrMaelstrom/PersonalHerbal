import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePhoto } from './hooks';
import { PhotoImg } from './PhotoImg';

/** Square thumbnail of a species' main photo, with a leaf placeholder when none is set. */
export function SpeciesPhotoThumb({
  photoId,
  className,
}: {
  photoId?: string;
  className?: string;
}) {
  const { data: photo } = usePhoto(photoId);
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        className,
      )}
    >
      {photo ? (
        <PhotoImg blob={photo.thumb ?? photo.blob} className="h-full w-full object-cover" />
      ) : (
        <Leaf className="size-1/2 text-muted-foreground/50" />
      )}
    </div>
  );
}
