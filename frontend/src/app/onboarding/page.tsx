import Link from "next/link";

export default function Onboarding() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-12">
        {/* Title Wireframe */}
        <div className="space-y-4">
          <div className="wf-text h-10 w-2/3" />
          <div className="wf-text h-4 w-1/2 opacity-50" />
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div 
              key={idx} 
              className="wf-box aspect-square rounded-[2rem] bg-white border-2 border-[#DEE2E6] hover:border-blue-500 transition-colors cursor-pointer"
            >
              <div className="wf-dot w-12 h-12 mb-4" />
              <div className="wf-text h-3 w-1/3" />
            </div>
          ))}
        </div>

        {/* Action Button */}
        <Link href="/dashboard" className="block">
           <div className="bg-blue-600 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg hover:bg-blue-500 transition-all cursor-pointer">
              Continue to Dashboard
           </div>
        </Link>
      </div>
    </main>
  );
}
