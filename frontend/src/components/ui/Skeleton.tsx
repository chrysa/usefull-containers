interface Props {
  width?: string;
  height?: string;
  radius?: string;
}

export default function Skeleton({ width = "100%", height = "16px", radius }: Props) {
  return (
    <div
      className="animate-pulse rounded-[var(--radius)] bg-muted"
      style={{ width, height, borderRadius: radius }}
    />
  );
}
