export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
    </div>
  );
}
