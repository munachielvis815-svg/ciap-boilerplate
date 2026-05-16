export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white border-2 border-[#111] rounded-4xl p-6 md:p-8 animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-8 bg-[#E5E5E5] rounded-2xl w-32"></div>
        <div className="h-20 bg-[#E5E5E5] rounded-2xl"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonChartBox() {
  return (
    <div className="bg-white border-2 border-[#111] rounded-4xl p-6 md:p-8 animate-pulse">
      <div className="space-y-4">
        <div className="h-8 bg-[#E5E5E5] rounded-2xl w-48"></div>
        <div className="h-60 bg-[#E5E5E5] rounded-2xl"></div>
      </div>
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="space-y-3 py-4 px-4 border-b border-[#E5E5E5]">
      <div className="h-4 bg-[#E5E5E5] rounded-lg w-full"></div>
      <div className="h-4 bg-[#E5E5E5] rounded-lg w-5/6"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border-2 border-[#111] rounded-4xl overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="h-6 bg-[#E5E5E5] rounded-lg w-48 mb-6"></div>
      </div>
      <div className="divide-y divide-[#E5E5E5]">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonCreatorCard() {
  return (
    <div className="bg-gradient-to-br from-[#60A5FA] to-[#F472B6] border-2 border-[#111] rounded-4xl p-6 md:p-8 animate-pulse">
      <div className="space-y-6">
        <div className="h-10 bg-white rounded-2xl w-3/4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-white rounded-lg w-full"></div>
          <div className="h-4 bg-white rounded-lg w-5/6"></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-white rounded-2xl"></div>
          <div className="h-12 bg-white rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCreatorGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCreatorCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonMetricBox({ color = "#60A5FA" }: { color?: string }) {
  return (
    <div className="border-2 border-[#111] rounded-4xl p-6 md:p-8 animate-pulse" style={{ backgroundColor: color }}>
      <div className="space-y-4">
        <div className="h-6 bg-white rounded-xl w-32"></div>
        <div className="h-12 bg-white rounded-2xl w-48"></div>
      </div>
    </div>
  );
}

export function SkeletonMetricsRow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <SkeletonMetricBox color="#60A5FA" />
      <SkeletonMetricBox color="#F472B6" />
    </div>
  );
}
