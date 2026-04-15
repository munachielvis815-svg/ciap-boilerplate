import Link from "next/link";

export default function Discovery() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 md:p-12 space-y-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <Link href="/dashboard" className="wf-box w-10 h-10 rounded-full" />
              <div className="wf-text h-8 w-48" />
           </div>
           <div className="wf-box w-16 h-10 rounded-xl" />
        </header>

        <section className="space-y-8">
           <div className="flex gap-4 items-center">
              <div className="wf-box h-12 flex-1 rounded-2xl" />
              <div className="wf-box w-32 h-12 rounded-2xl" />
           </div>
           <div className="flex gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="wf-box w-24 h-10 rounded-full" />
              ))}
           </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
           {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wf-box aspect-[3/4] rounded-[2rem] bg-white border-2 border-[#DEE2E6] flex flex-col p-6 items-start justify-end gap-4">
                 <div className="wf-dot w-12 h-12" />
                 <div className="wf-text h-4 w-3/4" />
                 <div className="wf-text h-3 w-1/2" />
                 <div className="wf-box h-10 w-full mt-4 rounded-xl" />
              </div>
           ))}
        </section>
      </div>
    </div>
  );
}
