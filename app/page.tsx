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
            <img src="/northstock-logo.png" alt="NorthStock" className="h-12 w-auto" />
          </a>

          <nav className="hidden gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="/listings">Browse Inventory</a>
            <a href="/list-inventory">List Inventory</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="/login" className="text-sm font-semibold text-slate-700">
              Log In
            </a>
            <a
              href="/login"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Free Account
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-flex rounded-full border bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Free account registration
            </p>

            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Buy and sell business inventory across Canada.
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Search office furniture, restaurant equipment, and contractor
              tools from businesses and sellers across Canada.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="rounded-xl bg-slate-950 px-6 py-4 text-center font-semibold text-white"
              >
                Create Free Account
              </a>

              <a
                href="/listings"
                className="rounded-xl border bg-white px-6 py-4 text-center font-semibold text-slate-950"
              >
                Browse Inventory
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-2 gap-4 text-sm text-slate-600 md:grid-cols-4">
              <div>Free signup</div>
              <div>Browse inventory</div>
              <div>Request quotes</div>
              <div>No buyer fees</div>
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
                    <a href="/listings" className="rounded-lg border px-3 py-2 text-sm">
                      View
                    </a>
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
          <a className="text-sm font-semibold text-slate-700" href="/listings">
            View all
          </a>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <a
              href="/listings"
              key={category.title}
              className="rounded-3xl border bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="text-2xl font-bold">{category.title}</h3>
              <p className="mt-3 text-slate-600">{category.description}</p>
              <p className="mt-6 font-semibold text-slate-950">Browse →</p>
            </a>
          ))}
        </div>
      </section>

      <footer id="contact" className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <img src="/northstock-logo.png" alt="NorthStock" className="h-10 w-auto" />

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-bold">NorthStock</h3>
              <p className="mt-2 text-sm text-slate-600">
                A marketplace for business inventory across Canada.
              </p>
            </div>

            <div>
              <h3 className="font-bold">Contact Us</h3>
              <p className="mt-2 text-sm text-slate-600">
                Email: info@northstock.ca
              </p>
            </div>

            <div>
              <h3 className="font-bold">Categories</h3>
              <p className="mt-2 text-sm text-slate-600">
                Office Furniture · Restaurant Equipment · Contractor Tools
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}