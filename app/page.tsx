const categories = [
  {
    title: "Office Furniture",
    description: "Chairs, desks, workstations, filing cabinets and more.",
  },
  {
    title: "Restaurant Equipment",
    description: "Prep tables, refrigeration, ovens, sinks and more.",
  },
  {
    title: "Contractor Tools",
    description: "Power tools, compressors, generators and jobsite equipment.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/">
  <img
    src="/northstock-logo.png"
    alt="NorthStock"
    className="h-12 w-auto"
  />
</a>

          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#">Browse Inventory</a>
            <a href="#">How It Works</a>
            <a href="#">For Sellers</a>
          </nav>

          <a
  href="/list-inventory"
  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
>
  List Inventory
</a>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Buy and sell business inventory across Canada.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Search office furniture, restaurant equipment, and contractor
              tools from verified businesses and sellers.
            </p>

            <div className="mt-8 flex max-w-2xl gap-3 rounded-2xl border bg-white p-2 shadow-sm">
              <input
                type="text"
                placeholder="Search office chairs, prep tables, DeWalt tools..."
                className="flex-1 rounded-xl px-4 outline-none"
              />
              <button className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white">
                Search
              </button>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 text-sm text-slate-600">
              <div>Verified sellers</div>
              <div>Local inventory</div>
              <div>Direct quotes</div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-slate-100 p-6">
              <p className="text-sm font-semibold text-slate-500">
                Featured inventory
              </p>

              <div className="mt-5 space-y-4">
                {[
                  "Herman Miller Aeron Chair",
                  "Stainless Steel Prep Table",
                  "DeWalt 20V Max Drill Set",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-semibold">{item}</p>
                      <p className="text-sm text-slate-500">Available now</p>
                    </div>
                    <button className="rounded-lg border px-3 py-2 text-sm">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Browse by category</h2>
          <a className="text-sm font-semibold text-slate-700" href="#">
            View all
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.title}
              className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-2xl font-bold">{category.title}</h3>
              <p className="mt-3 text-slate-600">{category.description}</p>
              <button className="mt-6 font-semibold text-slate-950">
                Browse →
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}