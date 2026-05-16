export default function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full glass rounded-3xl overflow-hidden">
        {children}
      </table>
    </div>
  );
}