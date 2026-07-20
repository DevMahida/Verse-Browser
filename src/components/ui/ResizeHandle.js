export function ResizeHandle({ handleProps }) {
  return (
    <div
      {...handleProps}
      role="separator"
      aria-orientation="vertical"
      className="absolute left-0 top-0 bottom-0 w-1.5 -ml-[3px] shrink-0 touch-none cursor-col-resize bg-transparent transition-colors hover:bg-accent/20 active:bg-accent/40 z-50"
    />
  );
}
