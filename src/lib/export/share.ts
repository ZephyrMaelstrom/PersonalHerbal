import type { ExportArtifact } from './types';

function toBlob(a: ExportArtifact): Blob {
  return a.content instanceof Blob ? a.content : new Blob([a.content], { type: a.mime });
}

/**
 * Hand an artifact to the user: prefer the Android share sheet (so it can go to Drive,
 * email, Files, etc.), falling back to a direct download.
 */
export async function deliver(a: ExportArtifact): Promise<void> {
  const blob = toBlob(a);
  const file = new File([blob], a.filename, { type: a.mime });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: a.filename });
      return;
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = a.filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Open an HTML document in a print window (Android Chrome → "Save as PDF" or a printer). */
export function printHtml(html: string): void {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
