export default function ListInventoryPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-3xl px-6 py-16">

        <h1 className="text-4xl font-bold">
          List Your Inventory
        </h1>

        <p className="mt-3 text-slate-600">
          Upload inventory to NorthStock and connect with buyers across Canada.
        </p>

        <form className="mt-10 space-y-5 rounded-3xl border bg-white p-8 shadow-sm">

          <input
            placeholder="Company Name"
            className="w-full rounded-xl border p-4"
          />

          <input
            placeholder="Contact Name"
            className="w-full rounded-xl border p-4"
          />

          <input
            placeholder="Email"
            className="w-full rounded-xl border p-4"
          />

          <input
            placeholder="Phone Number"
            className="w-full rounded-xl border p-4"
          />

          <select className="w-full rounded-xl border p-4">
            <option>Select Category</option>
            <option>Office Furniture</option>
            <option>Restaurant Equipment</option>
            <option>Contractor Tools</option>
          </select>

          <select className="w-full rounded-xl border p-4">
            <option>Estimated Inventory Size</option>
            <option>1-50 Items</option>
            <option>50-500 Items</option>
            <option>500-5000 Items</option>
            <option>5000+ Items</option>
          </select>

          <textarea
            rows={5}
            placeholder="Tell us about your inventory..."
            className="w-full rounded-xl border p-4"
          />

          <button
            className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white"
          >
            Request Inventory Upload
          </button>

        </form>

      </div>
    </main>
  );
}