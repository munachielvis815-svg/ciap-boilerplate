import Link from "next/link";

export default function Insights() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 md:p-12 space-y-12 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-12">
        <header className="flex items-center gap-6">
           <Link href="/dashboard" className="wf-box w-10 h-10 rounded-full" />
           <div className="wf-text h-8 w-1/4" />
        </header>

        <section className="space-y-8">
           <div className="wf-text h-6 w-1/3" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="wf-box h-80 rounded-[2rem] bg-white" />
              <div className="wf-box h-80 rounded-[2rem] bg-white" />
           </div>
        </section>

        <section className="space-y-8">
           <div className="wf-text h-6 w-1/3" />
           <div className="wf-box h-[400px] rounded-[2rem] bg-white" />
        </section>
      </div>
    </div>
  );
}
