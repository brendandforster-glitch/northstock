export default function InviteSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <section className="mx-auto flex max-w-3xl items-center justify-center px-6 py-20">
        <div className="w-full rounded-3xl border border-slate-300 bg-white p-8 text-center shadow-sm">
          <img
            src="/northstock-logo.png"
            alt="NorthStock"
            className="mx-auto h-12 w-auto"
          />

          <h1 className="mt-8 text-4xl font-bold">
            Seller Account Created
          </h1>

          <p className="mt-4 text-slate-700">
            Your NorthStock seller account has been created and your company
            profile has been linked.
          </p>

          <p className="mt-3 text-slate-700">
            Please check your email to confirm your account, then log in to
            manage your profile, inventory, and quote requests.
          </p>

          <a
            href="/login"
            className="mt-8 inline-block rounded-xl bg-slate-950 px-6 py-4 font-semibold text-white"
          >
            Go to Login
          </a>
        </div>
      </section>
    </main>
  );
}