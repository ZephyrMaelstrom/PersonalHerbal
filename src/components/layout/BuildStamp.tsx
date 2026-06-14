/** Tiny build identifier so it's obvious on the phone whether the latest push deployed. */
export function BuildStamp() {
  const time = new Date(__BUILD_TIME__);
  const when = Number.isNaN(time.getTime()) ? __BUILD_TIME__ : time.toLocaleString();
  return (
    <p className="pt-2 text-center text-[11px] text-muted-foreground">
      build {__BUILD_SHA__} · {when}
    </p>
  );
}
