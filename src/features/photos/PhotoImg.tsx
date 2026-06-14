import { useEffect, useState } from 'react';

/** Renders a Blob as an <img>, creating and revoking its object URL safely. */
export function PhotoImg({
  blob,
  alt = '',
  className,
}: {
  blob: Blob;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
