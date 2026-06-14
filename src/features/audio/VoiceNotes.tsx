import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAddAudio, useDeleteAudio, useSpeciesAudio } from './hooks';
import type { AudioNote } from '@/lib/storage';

function Player({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url ? <audio controls src={url} className="h-9 w-full" /> : null;
}

export function VoiceNotes({ speciesId }: { speciesId: string }) {
  const { data: notes = [] } = useSpeciesAudio(speciesId);
  const add = useAddAudio(speciesId);
  const del = useDeleteAudio(speciesId);
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        const mime = rec.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        stream.getTracks().forEach((t) => t.stop());
        if (blob.size) await add.mutateAsync({ speciesId, blob, mime });
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      toast({ message: 'Microphone access was not granted.' });
    }
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  function remove(n: AudioNote) {
    del.mutate(n.id);
    toast({
      message: 'Voice note deleted',
      actionLabel: 'Undo',
      onAction: () => add.mutate({ speciesId, blob: n.blob, mime: n.mime }),
    });
  }

  return (
    <div className="space-y-2">
      {recording ? (
        <Button type="button" variant="destructive" onClick={stop}>
          <Square /> Stop recording
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={start}>
          <Mic /> Record voice note
        </Button>
      )}
      {notes.map((n) => (
        <div key={n.id} className="flex items-center gap-2">
          <Player blob={n.blob} />
          <Button variant="ghost" size="icon" className="shrink-0 text-destructive-foreground/70" onClick={() => remove(n)}>
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  );
}
