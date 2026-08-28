import Skeleton from "@/components/ui/Skeleton";

/**
 * Loading placeholder for the plan detail page, mirroring the final layout
 * (breadcrumb, title, target items, linked blueprints) so the page doesn't
 * jump once data arrives.
 */
export default function PlanDetailSkeleton() {
  return (
    <main className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Skeleton width="60px" height="13px" />
        <span className="text-muted-foreground" aria-hidden="true">
          /
        </span>
        <Skeleton width="140px" height="13px" />
      </div>

      <Skeleton width="260px" height="32px" />
      <Skeleton width="100%" height="56px" radius="6px" />

      <section className="flex flex-col gap-2">
        <Skeleton width="120px" height="18px" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="44px" radius="6px" />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Skeleton width="150px" height="18px" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height="44px" radius="6px" />
          ))}
        </div>
      </section>
    </main>
  );
}
