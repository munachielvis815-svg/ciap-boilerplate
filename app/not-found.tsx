export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F0] via-[#FCE4EC] to-[#E0F7FA] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-[160px] mb-8 animal-float">🐨</div>
        <h1 className="text-7xl font-bold gradient-text mb-6">404</h1>
        <p className="text-3xl text-zinc-600 mb-10">This page wandered off...</p>
        <a href="/dashboard" className="inline-block px-12 py-6 rounded-3xl bg-gradient-to-r from-[#FF8A65] to-[#BA68C8] text-white text-xl font-semibold hover:brightness-110 transition-all">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}