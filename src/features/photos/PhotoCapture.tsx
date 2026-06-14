import { useRef } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Two ways to add a photo on Android:
 *  - "Take photo"  → opens the camera directly (capture attribute).
 *  - "From library" → opens the gallery / files picker (no capture, multi-select).
 */
export function PhotoCapture({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = ''; // allow re-selecting the same file
  }

  return (
    <div className="flex gap-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handle} />
      <input ref={libraryRef} type="file" accept="image/*" multiple hidden onChange={handle} />
      <Button type="button" variant="outline" disabled={disabled} onClick={() => cameraRef.current?.click()}>
        <Camera /> Take photo
      </Button>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => libraryRef.current?.click()}>
        <ImagePlus /> From library
      </Button>
    </div>
  );
}
