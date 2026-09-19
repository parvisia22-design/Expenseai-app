// Material Symbols Outlined helper. Font is loaded in app/layout.tsx.
export function Icon({
  name,
  size = 20,
  filled = false,
  className = "",
}: {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "fill-icon" : ""} ${className}`}
      style={{ fontSize: `${size}px` }}
      aria-hidden
    >
      {name}
    </span>
  );
}
