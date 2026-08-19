export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6 text-slate-950">
      <div className="max-w-xl rounded-3xl border bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-extrabold uppercase tracking-widest text-blue-600">404</p>
        <h1 className="mt-3 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-4 text-slate-600">The page may have moved, expired, or no longer be available.</p>
        <a href="/" className="mt-7 inline-block rounded-xl bg-slate-950 px-6 py-4 font-bold text-white">Return to NorthStock</a>
      </div>
    </main>
  );
}
