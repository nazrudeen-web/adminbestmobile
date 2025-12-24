# Admin Panel Setup & Usage Guide

## Overview
This admin panel allows you to manage all product data that will be displayed on your frontend. All data entered here can be fetched via API endpoints.

## Table of Contents
1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [Admin Panel Features](#admin-panel-features)
4. [API Endpoints for Frontend](#api-endpoints-for-frontend)
5. [Data Entry Workflow](#data-entry-workflow)

## Database Setup

### 1. Run Migrations
Execute the SQL migrations in order:

```bash
# Connect to your Supabase database and run:
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/migrations/002_enhance_schema.sql
psql -h [your-supabase-host] -U postgres -d postgres -f supabase/migrations/003_sample_data.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 2. Database Schema Overview

**Main Tables:**
- `brands` - Phone manufacturers (Apple, Google, Samsung, etc.)
- `products` - Phone models
- `product_variants` - Storage/color combinations
- `product_images` - Product photos
- `specifications` - Detailed tech specs grouped by category
- `key_specifications` - Top 4-6 highlights shown prominently
- `expert_ratings` - Review scores and detailed ratings
- `stores` - Retailers (Amazon, Noon, etc.)
- `prices` - Price listings for each variant at each store
- `related_products` - Similar phone recommendations

## Environment Configuration

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Admin Panel Features

### 1. Brands Management (`/brands`)
- Create/edit/delete phone brands
- Upload brand logos
- Set active status

### 2. Stores Management (`/stores`)
- Add online retailers
- Set delivery times
- Mark official/authorized sellers
- Add store logos and website URLs

### 3. Products Management (`/products`)

#### Main Product Information (`/products/new` or `/products/[id]/edit`)
- **Brand**: Select manufacturer
- **Name**: Product name (e.g., "iPhone 16 Pro")
- **Slug**: URL-friendly identifier (auto-generated)
- **Description**: Short product description
- **Launch Year**: Release year
- **Main Image**: Primary product photo URL
- **Badge**: Optional tag (e.g., "Best Choice", "Editor's Pick")
- **Active Status**: Show/hide product

#### Product Images (`/products/[id]/images`)
- Upload multiple product photos
- Set main image
- Arrange display order
- Each image needs a URL

#### Product Variants (`/products/[id]/variants`)
- **Storage**: 256GB, 512GB, 1TB, etc.
- **Color**: Color name (e.g., "Natural Titanium")
- **Color Hex**: Hex code for UI display (e.g., "#E8E3D9")
- **SKU**: Stock keeping unit code
- **Variant Image**: Optional color-specific image
- **Availability**: In stock or not

**Example Variants:**
- 256GB, Natural Titanium, #E8E3D9
- 256GB, Blue Titanium, #5B7C99
- 512GB, Natural Titanium, #E8E3D9

#### Key Specifications (`/products/[id]/key-specs`)
Top highlights displayed prominently on product page (4-6 recommended):

- **Icon**: Icon identifier (display, processor, storage, battery)
- **Title**: Spec category name
- **Value**: Spec value

**Examples:**
- Icon: `display`, Title: "Display", Value: "6.3\" OLED, 120Hz"
- Icon: `processor`, Title: "Processor", Value: "Apple A18 Pro"
- Icon: `storage`, Title: "Storage", Value: "256GB / 512GB / 1TB"
- Icon: `battery`, Title: "Battery", Value: "3582 mAh, 25W fast charging"

#### Full Specifications (`/products/[id]/specs`)
Detailed tech specs organized by categories:

**Spec Groups:**
- **Display**: Screen Size, Resolution, Display Type, Refresh Rate, Glass
- **Performance**: Processor, RAM, Storage, GPU
- **Camera**: Main Camera, Front Camera, Video Recording
- **Battery**: Battery Capacity, Charging, Wireless Charging
- **Connectivity**: Network, SIM, Wi-Fi, Bluetooth, USB, NFC
- **Design**: Dimensions, Weight, Build, Colors, Water Resistance

#### Expert Ratings (`/products/[id]/ratings`)
Professional review scores and detailed feedback:

**Overall Scores (0-10):**
- Overall Score
- Camera Score
- Battery Score
- Performance Score
- Display Score

**Detailed Information:**
For each category (Camera, Battery, Performance, Display):
- Add specific details (e.g., "Strong main camera for everyday shots")
- Each category can have multiple detail points

**Pros & Cons:**
- List positive aspects
- List drawbacks or limitations

**Example:**
- Camera: 8.6/10
  - Details: "Strong main camera for everyday shots", "Extra lens options"
- Battery: 8.6/10
  - Details: "All-day battery for most users"
- Pros: ["Solid cameras", "High-end performance"]
- Cons: ["Smaller battery capacity"]

### 4. Prices Management (`/prices`)

Add price listings for each product variant at different stores:

- **Product**: Select phone model
- **Variant**: Select storage/color combination
- **Store**: Select retailer
- **Price**: Current price in AED
- **Old Price**: Original price (for showing discounts)
- **Stock Status**: in_stock, low_stock, out_of_stock
- **Delivery Info**: Special delivery notes
- **Affiliate URL**: Link to store's product page

**Auto-Calculated:**
- Best price automatically updates when you add/edit prices
- Best store is tracked
- Price last updated timestamp

## API Endpoints for Frontend

### 1. Get Product Details
```
GET /api/products/[slug]
```

**Example:** `/api/products/iphone-16-pro`

**Response includes:**
- Product information
- Brand details
- All variants (storage/color options)
- Expert ratings with detailed scores
- Key specifications
- Full specifications (grouped by category)
- Best price information
- All images

### 2. Get Product Prices
```
GET /api/products/[slug]/prices?storage=256GB&color=Natural%20Titanium
```

**Query Parameters:**
- `storage` (optional): Filter by storage size
- `color` (optional): Filter by color

**Response includes:**
- List of prices from all stores
- Price statistics (lowest, highest, average)
- Store details (delivery time, official status, etc.)
- Discount calculations

### 3. Get Products List
```
GET /api/products?page=1&limit=20&brand=apple&search=iphone&sortBy=created_at&sortOrder=desc
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `brand`: Filter by brand slug
- `search`: Search in product names
- `sortBy`: Sort field (default: created_at)
- `sortOrder`: asc or desc (default: desc)

**Response includes:**
- Array of products with basic info
- Pagination metadata
- Brand information
- Best price for each product

## Data Entry Workflow

### Adding a New Product (Complete Flow)

#### Step 1: Create Brand (if needed)
1. Go to `/brands/new`
2. Enter brand name and logo
3. Save

#### Step 2: Create Stores (if needed)
1. Go to `/stores/new`
2. Add retailers where product will be sold
3. Save each store

#### Step 3: Create Product
1. Go to `/products/new`
2. Fill in:
   - Brand
   - Product name (e.g., "iPhone 16 Pro")
   - Description
   - Launch year
   - Main image URL
   - Badge (optional)
3. Save product

#### Step 4: Add Product Images
1. Go to `/products/[id]/images`
2. Add multiple product images
3. Set one as main image
4. Arrange order

#### Step 5: Add Variants
1. Go to `/products/[id]/variants`
2. For each storage/color combination:
   - Storage (e.g., "256GB")
   - Color name (e.g., "Natural Titanium")
   - Color hex code (e.g., "#E8E3D9")
   - SKU
   - Mark as available
3. Add all combinations

#### Step 6: Add Key Specifications
1. Go to `/products/[id]/key-specs`
2. Add 4-6 key highlights:
   - Display specs
   - Processor
   - Storage options
   - Battery info
3. Arrange order

#### Step 7: Add Full Specifications
1. Go to `/products/[id]/specs`
2. Add specifications for each group:
   - Display (screen size, resolution, type, etc.)
   - Performance (CPU, RAM, storage, GPU)
   - Camera (main, front, video)
   - Battery (capacity, charging)
   - Connectivity (network, SIM, Wi-Fi, Bluetooth)
   - Design (dimensions, weight, build, colors)

#### Step 8: Add Expert Ratings
1. Go to `/products/[id]/ratings`
2. Enter scores (0-10):
   - Overall score
   - Camera score + details
   - Battery score + details
   - Performance score + details
   - Display score + details
3. Add pros and cons
4. Save

#### Step 9: Add Prices
1. Go to `/prices/new`
2. For each variant at each store:
   - Select product
   - Select variant (storage/color)
   - Select store
   - Enter price
   - Enter old price (if discount)
   - Set stock status
   - Add affiliate URL
3. Save each price

**Note:** Best price will auto-update!

## Frontend Integration

### Example: Fetching Product Data

```javascript
// In your Next.js frontend
const fetchProductData = async (slug) => {
  const response = await fetch(`/api/products/${slug}`)
  const product = await response.json()
  
  // Product data structure:
  // {
  //   name: "iPhone 16 Pro",
  //   brand: { name: "APPLE", logo: "..." },
  //   bestPrice: { amount: 80741, store: "Amazon.ae" },
  //   variants: {
  //     storage: ["256GB", "512GB", "1TB"],
  //     colors: [{ color: "Natural Titanium", color_hex: "#E8E3D9" }]
  //   },
  //   expertRating: {
  //     overallScore: 8.3,
  //     scores: {
  //       camera: { score: 8.0, details: [...] },
  //       battery: { score: 6.5, details: [...] }
  //     }
  //   },
  //   keySpecifications: [...],
  //   specifications: { Display: [...], Performance: [...] },
  //   prices: { items: [...], count: 5 }
  // }
}
```

### Example: Displaying Data

```jsx
// Product page component
function ProductPage({ slug }) {
  const [product, setProduct] = useState(null)
  
  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => setProduct(data))
  }, [slug])
  
  if (!product) return <Loading />
  
  return (
    <div>
      <h1>{product.brand.name} {product.name}</h1>
      <div>Best Price: AED {product.bestPrice.amount}</div>
      
      {/* Storage options */}
      <div>
        {product.variants.storage.map(storage => (
          <button key={storage}>{storage}</button>
        ))}
      </div>
      
      {/* Color options */}
      <div>
        {product.variants.colors.map(color => (
          <div 
            key={color.color}
            style={{ backgroundColor: color.color_hex }}
            title={color.color}
          />
        ))}
      </div>
      
      {/* Expert ratings */}
      <div>
        <h2>Expert Rating: {product.expertRating.overallScore}/10</h2>
        <div>
          Camera: {product.expertRating.scores.camera.score}/10
          {product.expertRating.scores.camera.details.map((detail, i) => (
            <li key={i}>{detail}</li>
          ))}
        </div>
      </div>
      
      {/* Key specs */}
      {product.keySpecifications.map(spec => (
        <div key={spec.id}>
          <strong>{spec.title}:</strong> {spec.value}
        </div>
      ))}
      
      {/* Full specs */}
      {Object.entries(product.specifications).map(([group, specs]) => (
        <div key={group}>
          <h3>{group}</h3>
          {specs.map((spec, i) => (
            <div key={i}>
              <span>{spec.name}:</span> <span>{spec.value}</span>
            </div>
          ))}
        </div>
      ))}
      
      {/* Prices from different stores */}
      <div>
        <h3>Compare Prices (from {product.prices.count} stores)</h3>
        {product.prices.items.map(price => (
          <div key={price.id}>
            <img src={price.store.logo} alt={price.store.name} />
            <span>{price.store.name}</span>
            <span>AED {price.price}</span>
            {price.oldPrice && (
              <span>Was: AED {price.oldPrice} (-{price.discount}%)</span>
            )}
            <a href={price.affiliateUrl}>Buy Now</a>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Tips & Best Practices

1. **Images**: Use high-quality product images. Consider using a CDN or Supabase Storage.

2. **Color Hex Codes**: Use accurate hex codes for color variants. Test them in the UI.

3. **Prices**: Update prices regularly. The system tracks last updated date.

4. **Specifications**: Be consistent with spec names across products (e.g., always use "Screen Size" not "Display Size").

5. **Expert Ratings**: Keep scores objective and add detailed explanations.

6. **SEO**: Use descriptive product names and slugs. Add comprehensive specifications.

7. **Variants**: Add all storage/color combinations that are actually available.

8. **Key Specs**: Limit to 4-6 most important specs for better UX.

## Troubleshooting

### Price not updating?
- Check that variant_id and store_id are correct
- Ensure stock_status is not 'out_of_stock' (best price only considers in-stock items)
- The trigger runs automatically when prices change

### Expert score not showing?
- Make sure you've saved the expert ratings
- The overall_score automatically updates the product's expert_score field

### API returning empty data?
- Verify product is set to `is_active = true`
- Check that the slug is correct
- Ensure related data (variants, specs, etc.) have been added

### Variants not showing colors?
- Add color_hex values to each variant
- Hex codes should be in format #RRGGBB

## Support

For issues or questions:
1. Check the database views: `product_complete_view`, `variant_prices_view`
2. Check Supabase logs for errors
3. Verify all migrations have run successfully
4. Check browser console for API errors

---

**Last Updated:** December 2025
