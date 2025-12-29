# Frontend AI: Supabase Integration Guide

A clean, actionable summary to implement data fetching, mutations, and storage for the admin panel using Supabase.

## Quick Setup

- Env vars:
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client reads)
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, for privileged storage deletes)
- Client:
  - Supabase client is initialized in [lib/supabase.js](lib/supabase.js)
  - Import and use directly in server/client components as needed
- Project pages and APIs are under [app](app).

## Data Model Overview

- Core tables: `brands`, `products`, `product_images`, `product_variants`, `key_specifications`, `specifications`, `expert_ratings`, `stores`, `prices`, `related_products`, `price_history`
- Views:
  - `product_complete_view`: full product with brand, images, variants, ratings, best price
  - `variant_prices_view`: prices joined to stores and variants
- Migrations defining these live in [supabase/migrations](supabase/migrations) (see 002/005/006/008 for view definitions).

## Fetch Patterns

- Server components (preferred for lists):
  ```js
  const { data, error } = await supabase
    .from('products')
    .select('*, brands(id, name)')
    .order('created_at', { ascending: false })
  ```
- Route handlers (for pagination/search/joins via views):
  - List endpoint: [app/api/products/route.js](app/api/products/route.js)
    - Query params: `page`, `limit`, `brand`, `search`, `sortBy`, `sortOrder`
    - Source: `product_complete_view` with `.range()` for pagination
  - Detail endpoint: [app/api/products/[slug]/route.js](app/api/products/%5Bslug%5D/route.js)
    - Sources: `product_complete_view` (single by `slug`), `variant_prices_view` by `product_id`
- Client components (interactive pages):
  - Use local state + Supabase queries (e.g., images management in [app/products/[id]/images/page.js](app/products/%5Bid%5D/images/page.js))

## Page → Data Mapping

- Brands: [app/brands/page.js](app/brands/page.js) → `brands`
- Stores: [app/stores/page.js](app/stores/page.js) → `stores`
- Products list: [app/products/page.js](app/products/page.js) → `products` + `brands`
- Product detail workflows: [app/products/[id]/*](app/products/%5Bid%5D)
  - `edit` → `products` (+ `brands`)
  - `images` → `products`, `product_images`, storage bucket `products`
  - `variants` → `product_variants` (storage-only after migration 008)
  - `key-specs` → `key_specifications`
  - `specs` → `specifications`
  - `ratings` → `expert_ratings`
  - `prices` → `prices` (+ `stores`, `product_variants`)
  - `related-products` → `related_products` (nested product)
  - `preview` aggregates all above (see [app/products/[id]/preview/page.js](app/products/%5Bid%5D/preview/page.js))

## Storage Integration (Images)

- Upload & List:
  - Use `ImageUpload` component (see [components/shared/image-upload.jsx](components/shared/image-upload.jsx)) with bucket `products`
  - List with: `supabase.storage.from('products').list('', { limit, sortBy })`
  - Get public URL: `supabase.storage.from('products').getPublicUrl(file.name)`
- Persist to DB:
  - Insert into `product_images` with `product_id`, `image_url`, `is_main`, `sort_order`
  - Optionally set `products.main_image` for the main image
- Delete (secure):
  - Call [app/api/storage/delete/route.js](app/api/storage/delete/route.js) with `{ bucket, imageUrl, fileName, productId }`
  - This uses `SUPABASE_SERVICE_ROLE_KEY` server-side, then clear DB record and `main_image` if needed

## CRUD Examples

- Create brand:
  ```js
  await supabase.from('brands').insert([{ name, slug, logo, is_active: true }])
  ```
- Create product:
  ```js
  await supabase.from('products').insert([{ brand_id, name, slug, description, launch_year, is_active: false }])
  ```
- Update product main image:
  ```js
  await supabase.from('products').update({ main_image: imageUrl }).eq('id', productId)
  ```
- Add price:
  ```js
  await supabase.from('prices').insert([{ product_id, variant_id, store_id, price, old_price, affiliate_url }])
  ```
- Delete price:
  ```js
  await supabase.from('prices').delete().eq('id', priceId)
  ```

## Pagination, Search, Sort (Views)

- Listing from view:
  ```js
  const page = 1, limit = 20
  const offset = (page - 1) * limit
  const query = supabase
    .from('product_complete_view')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .ilike('name', `%${search || ''}%`)
    .order(sortBy || 'created_at', { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1)
  const { data, error, count } = await query
  ```

## DTO Shapes (Recommended)

- Product list item:
  ```ts
  type ProductListItem = {
    id: string
    name: string
    slug: string
    brand: { name: string; slug: string; logo?: string }
    mainImage?: string
    badge?: string
    bestPrice?: number
    expertScore?: number
    launchYear?: number
    storageOptions: string[]
  }
  ```
- Price item (normalized):
  ```ts
  type PriceItem = {
    id: string
    store: { id: string; name: string; logo?: string; websiteUrl?: string; isOfficial?: boolean; isAuthorized?: boolean }
    variant: { id: string; storage?: string; color?: string; colorHex?: string }
    price: number
    oldPrice?: number | null
    discount?: number | null
    affiliateUrl?: string
    updatedAt?: string
  }
  ```

## Validation

- Use Zod for form inputs before mutations:
  ```ts
  import { z } from 'zod'
  const ProductSchema = z.object({
    brand_id: z.string().uuid(),
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
    launch_year: z.number().int().min(2000).max(2100),
    is_active: z.boolean()
  })
  ```

## Error Handling

- Always guard Supabase responses:
  ```js
  const { data, error } = await supabase.from('prices').select('*')
  if (error) { /* log + show toast */ }
  ```
- Provide fallbacks when relations fail (see [app/prices/page.js](app/prices/page.js)).

## Example Endpoints

- List products via our API:
  ```js
  const res = await fetch('/api/products?page=1&limit=20&sortBy=created_at&sortOrder=desc')
  const { products, pagination } = await res.json()
  ```
- Product detail via our API:
  ```js
  const res = await fetch(`/api/products/${slug}`)
  const product = await res.json()
  ```

## Implementation Checklist

- Reads in server components whenever possible; writes in client or route handlers
- Use views for aggregated reads; keep client payloads small and normalized
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client; call secure routes for privileged ops
- Reuse table/form components; align field names with existing structure
- Add pagination/search/sort consistently; ensure error handling with toasts

## Ready-To-Start Tasks

1. Wire list pages with server-side queries and pass data to tables
2. Implement product detail fetch via `/api/products/[slug]` for the public frontend
3. Complete image upload/manage flows using storage and DB records
4. Add Zod validation to create/edit forms before Supabase mutations
5. Normalize DTOs in table components for consistency and type safety

---

If you need more examples for a specific page (e.g., variants editor), follow patterns in the preview and images pages and reference the migrations under [supabase/migrations](supabase/migrations) for exact field names.
