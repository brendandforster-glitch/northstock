# NorthStock International Deployment

NorthStock now supports English-language inventory and buyer requests worldwide.
Prices remain in the seller-selected currency; the platform does not perform automatic currency conversion.

## Deployment order

1. Open the production Supabase project and run `supabase/international-marketplace.sql` in the SQL Editor.
2. Confirm `country_code` and `currency_code` appear on `listings` and `buyer_requests`, and `country_code` appears on `companies` and `saved_searches`.
3. Deploy this application build to Vercel.
4. Create one test company, listing, buyer request, and saved search with an international country.
5. Download the inventory template and verify the `country_code`, `currency_code`, and `region_state_province` columns.

## Scope

- Worldwide country selection
- Seller-selected listing and budget currencies
- Country and region filtering
- Country-aware saved-search alerts
- International Excel import and export
- Worldwide location display and marketplace copy
- Existing Canada/US radius search retained

## Intentional limitations

- English only
- No automatic currency conversion
- No country-specific tax, payment, shipping, or legal automation
- Radius search remains limited to Canadian and US cities currently stored in `city_coordinates`
