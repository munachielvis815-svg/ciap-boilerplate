export default function Dashboard() {
  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      {/* Sidebar Skeleton */}
      <aside className="w-64 border-r-2 border-[#DEE2E6] bg-white hidden md:flex flex-col p-8 space-y-12">
        <div className="flex items-center gap-4">
          <div className="wf-box w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="wf-text h-6 w-full" />
        </div>

        <div className="space-y-6 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
               <div className="wf-dot w-6 h-6 flex-shrink-0" />
               <div className="wf-text h-4 w-full" />
            </div>
          ))}
        </div>

        <div className="wf-box h-32 rounded-2xl w-full" />
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
        {/* Header Wireframe */}
        <header className="flex items-center justify-between">
          <div className="wf-text h-8 w-1/4" />
          <div className="flex items-center gap-6">
            <div className="wf-box w-64 h-12 rounded-full" />
            <div className="wf-dot w-12 h-12" />
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="wf-box h-32 rounded-[2rem] bg-white" />
          ))}
        </div>

        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="wf-text h-6 w-1/3" />
            <div className="wf-box h-[400px] rounded-[2.5rem] bg-white shadow-sm" />
          </div>

          {/* Right Column (Intelligence) */}
          <div className="space-y-6">
             <div className="wf-text h-6 w-1/2" />
             <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                   <div key={i} className="wf-box h-24 rounded-[1.5rem] bg-white" />
                ))}
             </div>
             <div className="wf-box h-14 rounded-xl w-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
