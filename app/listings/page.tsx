"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  category: string;
  quantity: number;
  city: string;
  province: string | null;
  description: string;
  image_url: string | null;
  status: string | null;
  expires_at: string | null;
  price: number | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  sku: string | null;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  company_name?: string;
};

const categories = [
  "Office Furniture",
  "Restaurant Equipment",
  "Contractor Tools",
];

const regions = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
  "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
  "Washington", "West Virginia", "Wisconsin", "Wyoming",
  "British Columbia", "Alberta", "Saskatchewan", "Manitoba", "Ontario",
  "Quebec", "New Brunswick", "Nova Scotia", "Prince Edward Island",
  "Newfoundland and Labrador", "Yukon", "Northwest Territories", "Nunavut",
];

function formatPrice(price: number | null) {
  if (price === null || price === undefined) return "Contact for pricing";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Not set";

  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [radiusKm, setRadiusKm] = useState("");
  const [keywordSearch, setKeywordSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savingSearch, setSavingSearch] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const addCompanyNames = async (items: Listing[]) => {
    const listingsWithCompanies = await Promise.all(
      items.map(async (listing) => {
        const { data: company } = await supabase
          .from("companies")
          .select("company_name")
          .eq("user_id", listing.user_id)
          .maybeSingle();

        return {
          ...listing,
          company_name: company?.company_name || "",
        };
      })
    );

    return listingsWithCompanies;
  };

  const applyKeywordFilter = (items: Listing[], keyword: string) => {
    const search = keyword.toLowerCase().trim();

    if (!search) return items;

    return items.filter((item) =>
      [
        item.title,
        item.description,
        item.brand,
        item.model,
        item.sku,
        item.category,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search))
    );
  };

  const loadListings = async (
    regionFilter = selectedRegion,
    cityFilter = citySearch,
    radiusFilter = radiusKm,
    keywordFilter = keywordSearch,
    categoryFilter = selectedCategories
  ) => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (cityFilter.trim() && radiusFilter) {
      const { data: cityData } = await supabase
        .from("city_coordinates")
        .select("latitude, longitude")
        .ilike("city", cityFilter.trim())
        .eq("province", regionFilter)
        .maybeSingle();

      if (!cityData) {
        setListings([]);
        setLoading(false);
        alert("City coordinates not found. Try selecting the matching province/state.");
        return;
      }

      const { data, error } = await supabase.rpc("nearby_listings", {
        search_lat: cityData.latitude,
        search_lng: cityData.longitude,
        radius_km: Number(radiusFilter),
      });

      if (!error && data) {
        let filteredData = data as Listing[];

        if (regionFilter) {
          filteredData = filteredData.filter(
            (item) => item.province === regionFilter
          );
        }

        if (categoryFilter.length > 0) {
          filteredData = filteredData.filter((item) =>
            categoryFilter.includes(item.category)
          );
        }

        filteredData = applyKeywordFilter(filteredData, keywordFilter);

        setListings(await addCompanyNames(filteredData));
      } else {
        setListings([]);
      }

      setLoading(false);
      return;
    }

    let query = supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (regionFilter) {
      query = query.eq("province", regionFilter);
    }

    if (cityFilter.trim()) {
      query = query.ilike("city", `%${cityFilter.trim()}%`);
    }

    if (categoryFilter.length > 0) {
      query = query.in("category", categoryFilter);
    }

    const { data, error } = await query;

    if (!error && data) {
      const filteredData = applyKeywordFilter(data as Listing[], keywordFilter);
      setListings(await addCompanyNames(filteredData));
    } else {
      setListings([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadListings("", "", "", "", []);
  }, []);

  const applyFilters = () => {
    loadListings(
      selectedRegion,
      citySearch,
      radiusKm,
      keywordSearch,
      selectedCategories
    );
  };

  const clearFilters = () => {
    setSelectedRegion("");
    setCitySearch("");
    setRadiusKm("");
    setKeywordSearch("");
    setSelectedCategories([]);
    loadListings("", "", "", "", []);
  };

  const saveCurrentSearch = async () => {
    setSavingSearch(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingSearch(false);
      window.location.href = "/login";
      return;
    }

    const categoryName =
      selectedCategories.length > 0 ? selectedCategories.join(", ") : "";

    const searchNameParts = [
      keywordSearch ? keywordSearch : "",
      categoryName,
      citySearch ? citySearch : "",
      selectedRegion ? selectedRegion : "",
      radiusKm ? `${radiusKm} km` : "",
    ].filter(Boolean);

    const searchName =
      searchNameParts.length > 0
        ? searchNameParts.join(" · ")
        : "All NorthStock Inventory";

    const { error } = await supabase.from("saved_searches").insert([
      {
        user_id: user.id,
        name: searchName,
        category: categoryName,
        city: citySearch || "",
        province: selectedRegion || "",
        radius_km: radiusKm ? Number(radiusKm) : null,
        keyword: keywordSearch || "",
        email_alerts_enabled: true,
      },
    ]);

    setSavingSearch(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Search saved. Email alerts are enabled for this search.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-10">
        <p className="font-semibold text-slate-700">Loading inventory...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <a href="/">
            <img
              src="/northstock-logo.png"
              alt="NorthStock"
              className="h-12 w-auto"
            />
          </a>

          <div className="flex flex-wrap items-center gap-4">
            <a href="/" className="text-sm font-bold text-slate-950">
              Home
            </a>

            <a
              href="/saved-searches"
              className="text-sm font-bold text-slate-950"
            >
              Saved Searches
            </a>

            <a
              href="/saved-listings"
              className="text-sm font-bold text-slate-950"
            >
              Saved Listings
            </a>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-3xl border border-slate-300 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Filters</h2>

          <div className="mt-6 space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Keyword / Item Search
              </p>

              <input
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                placeholder="Search item, brand, model, SKU..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950 placeholder:text-slate-500"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Category
              </p>

              <div className="space-y-2 text-sm text-slate-700">
                {categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 text-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Province / State
              </p>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950"
              >
                <option value="">All Provinces / States</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                City Search
              </p>

              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search city"
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950 placeholder:text-slate-500"
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Radius
              </p>

              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-950"
              >
                <option value="">No radius</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
                <option value="250">250 km</option>
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Radius search requires a city and matching province/state.
              </p>
            </div>

            <button
              onClick={applyFilters}
              className="w-full rounded-xl bg-slate-950 py-3 font-semibold text-white"
            >
              Apply Filters
            </button>

            <button
              onClick={saveCurrentSearch}
              disabled={savingSearch}
              className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-50"
            >
              {savingSearch ? "Saving..." : "Save This Search"}
            </button>

            <button
              onClick={clearFilters}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 font-semibold text-slate-950"
            >
              Clear Filters
            </button>
          </div>
        </aside>

        <section>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventory</h1>
              <p className="mt-1 text-slate-700">
                {keywordSearch
                  ? `Showing results for "${keywordSearch}"`
                  : selectedCategories.length > 0
                  ? `Showing ${selectedCategories.join(", ")} listings`
                  : citySearch && radiusKm
                  ? `Showing listings within ${radiusKm} km of ${citySearch}`
                  : selectedRegion
                  ? `Showing active listings in ${selectedRegion}`
                  : "Showing active, non-expired NorthStock listings across North America"}
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-600">
              {listings.length} listing{listings.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-5">
            {listings.length > 0 ? (
              listings.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-5 rounded-3xl border border-slate-300 bg-white p-5 shadow-sm md:grid-cols-[180px_1fr_auto]"
                >
                  <div className="flex h-36 items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-500">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full rounded-2xl object-contain p-2"
                      />
                    ) : (
                      "Image"
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {item.category}
                    </p>

                    <h2 className="mt-1 text-xl font-bold">{item.title}</h2>

                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {formatPrice(item.price)}
                    </p>

                    {item.company_name && (
                      <p className="mt-1 font-semibold text-slate-700">
                        {item.company_name}
                      </p>
                    )}

                    <p className="mt-2 text-slate-700">
                      {item.city}
                      {item.province ? `, ${item.province}` : ""}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-800">
                          Quantity:
                        </span>{" "}
                        {item.quantity}
                      </p>

                      {item.condition && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Condition:
                          </span>{" "}
                          {item.condition}
                        </p>
                      )}

                      {item.brand && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Brand:
                          </span>{" "}
                          {item.brand}
                        </p>
                      )}

                      {item.model && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            Model:
                          </span>{" "}
                          {item.model}
                        </p>
                      )}

                      {item.sku && (
                        <p>
                          <span className="font-semibold text-slate-800">
                            SKU:
                          </span>{" "}
                          {item.sku}
                        </p>
                      )}

                      <p>
                        <span className="font-semibold text-slate-800">
                          Expires:
                        </span>{" "}
                        {formatDate(item.expires_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <a
                      href={`/listings/${item.id}`}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-slate-300 bg-white p-8 text-slate-700">
                No active listings available for this filter.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}