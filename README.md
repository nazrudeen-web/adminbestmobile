# Best Mobile Admin Panel

A comprehensive admin panel for managing mobile phone products, brands, stores, and prices. Built with Next.js 15, Supabase, and shadcn/ui.

> **📖 Quick Start**: See [QUICK_START.md](./QUICK_START.md) for rapid setup  
> **📚 Full Guide**: See [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md) for complete documentation

## ✨ Features

### Product Management
- **Complete Product Data** - Name, description, images, badge, launch year
- **Variants** - Storage options, colors with hex codes, SKUs, availability
- **Images** - Multiple product photos with sorting
- **Key Specifications** - Top 4-6 highlights with icons
- **Full Specifications** - Detailed specs organized by categories
- **Expert Ratings** - Overall and category scores (Camera, Battery, Performance, Display)
- **Rating Details** - Specific feedback for each category
- **Pros & Cons** - Listed advantages and limitations

### Price Management
- **Multi-Store Pricing** - Track prices across multiple retailers
- **Auto Best Price** - Automatically calculates and displays lowest price
- **Stock Status** - In stock, low stock, out of stock tracking
- **Price History** - Last updated timestamps
- **Delivery Info** - Store-specific delivery times and policies

### Other Features
- **Brands Management** - Phone manufacturers with logos
- **Stores Management** - Retailers with official/authorized badges
- **API Endpoints** - RESTful APIs for frontend integration
- **Search & Filter** - Quick search across all data
- **Responsive Design** - Works on desktop and tablet

## 🎨 Matches Your Frontend Design

The admin panel is specifically designed to manage all data shown in your product pages:
- ✅ Storage selection buttons (256GB, 512GB, 1TB)
- ✅ Color circles with hex codes
- ✅ Expert rating scores with detailed breakdowns
- ✅ Key specifications with icons
- ✅ Full specifications grouped by category
- ✅ Price comparison from multiple stores
- ✅ Best price highlighting
- ✅ Store badges (Official, Best Price)

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router, JavaScript)
- **Database:** Supabase (PostgreSQL)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## 📦 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Add your Supabase credentials to `.env.local`

### 3. Run Database Migrations
Execute SQL files in Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_enhance_schema.sql`
3. `supabase/migrations/003_sample_data.sql` (optional)

### 4. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

## 📁 Project Structure

```
adminbestmobile/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes for frontend
│   │   └── products/         # Product APIs
│   ├── brands/               # Brand management
│   ├── products/             # Product management
│   │   └── [id]/
│   │       ├── edit/         # Edit product
│   │       ├── images/       # Manage images
│   │       ├── variants/     # Storage/color variants
│   │       ├── key-specs/    # Key specifications
│   │       ├── specs/        # Full specifications
│   │       └── ratings/      # Expert ratings
│   ├── stores/               # Store management
│   └── prices/               # Price management
├── components/
│   ├── forms/                # Form components
│   ├── tables/               # Data tables
│   ├── layout/               # Layout components
│   ├── shared/               # Shared components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase.js          # Supabase client
│   └── utils.js             # Utility functions
└── supabase/
    └── migrations/           # Database migrations
```

## 🔗 API Endpoints

### For Your Frontend

```javascript
// Get complete product data
GET /api/products/[slug]
// Example: /api/products/iphone-16-pro

// Get price comparisons
GET /api/products/[slug]/prices?storage=256GB&color=Natural%20Titanium

// Get products list
GET /api/products?page=1&limit=20&brand=apple
```

See [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md) for complete API documentation.

## 📱 Managing Products

### Complete Flow for Adding a Phone

1. **Create Brand** (if new) → `/brands/new`
2. **Create Product** → `/products/new`
   - Basic info, name, description, badge
3. **Add Images** → `/products/[id]/images`
   - Upload product photos
4. **Add Variants** → `/products/[id]/variants`
   - Storage: 256GB, 512GB, 1TB
   - Colors with hex codes: Natural Titanium #E8E3D9
5. **Add Key Specs** → `/products/[id]/key-specs`
   - Display, Processor, Storage, Battery (4-6 items)
6. **Add Full Specs** → `/products/[id]/specs`
   - Display, Performance, Camera, Battery, Connectivity, Design
7. **Add Ratings** → `/products/[id]/ratings`
   - Overall score: 8.3/10
   - Category scores with details
   - Pros and cons
8. **Add Prices** → `/prices/new`
   - Price for each variant at each store
   - Best price auto-calculated

## 🎯 Key Features Explained

### Variants with Color Hex Codes
- Add storage options (256GB, 512GB, 1TB)
- Add color names and hex codes
- Frontend displays color circles using hex codes
- Example: Natural Titanium = #E8E3D9

### Expert Ratings with Details
- Overall score (e.g., 8.3/10)
- Category scores (Camera, Battery, Performance, Display)
- Detailed feedback for each category
- Separate pros and cons lists

### Auto Best Price Calculation
- Database trigger automatically finds lowest price
- Updates when any price changes
- Only considers in-stock items
- Tracks which store has best price

### Key vs Full Specifications
- **Key Specs**: 4-6 top highlights shown prominently
- **Full Specs**: Complete details grouped by category
- Both managed separately for flexibility

## 📖 Documentation

- [QUICK_START.md](./QUICK_START.md) - Rapid setup guide
- [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md) - Complete documentation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical summary

## 🎨 Example Data

Sample data for iPhone 16 Pro and Google Pixel 9 Pro is available in:
- `supabase/migrations/003_sample_data.sql`

This includes:
- Complete product information
- Multiple variants with colors
- Expert ratings with details
- Key and full specifications
- Structure for price entries

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd adminbestmobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

#### Run the Database Migration

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run it in the SQL Editor

This will create all necessary tables:
- `brands`
- `products`
- `product_images`
- `product_variants`
- `specifications`
- `expert_ratings`
- `stores`
- `prices`
- `related_products`

#### Create Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create three public buckets:
   - `brands` (for brand logos)
   - `products` (for product images)
   - `stores` (for store logos)

3. For each bucket, set the following policies:
   - **SELECT (read):** Allow public access
   - **INSERT (create):** Allow authenticated users
   - **DELETE:** Allow authenticated users

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the admin panel.

## Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── brands/                   # Brands CRUD pages
│   ├── products/                 # Products CRUD pages
│   │   └── [id]/                # Product sub-pages
│   │       ├── edit/            # Edit product
│   │       ├── images/          # Manage product images
│   │       ├── variants/        # Manage product variants
│   │       ├── specs/           # Manage specifications
│   │       └── ratings/         # Expert ratings
│   ├── stores/                   # Stores CRUD pages
│   ├── prices/                   # Prices management
│   ├── layout.js                # Root layout with sidebar
│   └── page.js                  # Dashboard
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components
│   ├── forms/                   # Form components
│   ├── tables/                  # Table components
│   └── shared/                  # Shared components
├── lib/
│   ├── supabase.js              # Supabase client
│   └── utils.js                 # Utility functions
├── supabase/
│   └── migrations/              # SQL migration files
└── public/                      # Static assets
```

## Usage Guide

### Managing Brands

1. Navigate to **Brands** from the sidebar
2. Click **Add Brand** to create a new brand
3. Fill in brand name (slug auto-generates)
4. Upload a brand logo
5. Toggle active status
6. Click **Create Brand**

### Managing Products

1. Navigate to **Products** from the sidebar
2. Click **Add Product** to create a new product
3. Fill in product details:
   - Select brand
   - Enter product name
   - Add description
   - Set launch year
4. After creating, use the action buttons to:
   - **Images:** Upload main and gallery images
   - **Variants:** Add storage/color variants
   - **Specs:** Add technical specifications
   - **Ratings:** Add expert ratings and pros/cons

### Managing Stores

1. Navigate to **Stores** from the sidebar
2. Click **Add Store**
3. Enter store details and upload logo
4. Mark as official store if applicable
5. Save the store

### Managing Prices

1. Navigate to **Prices** from the sidebar
2. Click **Add Price**
3. Select product (this loads variants)
4. Select variant
5. Select store
6. Enter price details:
   - Current price
   - Old price (optional, for discounts)
   - Stock status
   - Delivery info
   - Affiliate URL
7. Save the price

## Database Schema

### Key Tables

- **brands** - Phone brands (Apple, Samsung, etc.)
- **products** - Mobile phone products
- **product_images** - Product image gallery
- **product_variants** - Storage/color variants
- **specifications** - Technical specs grouped by category
- **expert_ratings** - Expert review scores and pros/cons
- **stores** - Retail stores and partners
- **prices** - Product prices per variant per store

### Relationships

- Products belong to Brands
- Product Images, Variants, Specs, and Ratings belong to Products
- Prices link Products, Variants, and Stores

## Build for Production

```bash
npm run build
npm start
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS Amplify

Make sure to set the environment variables on your hosting platform.

## Notes

- **No Authentication:** This admin panel is designed for personal use and doesn't include authentication. If you need auth, consider adding Supabase Auth.
- **Image Upload:** Images are stored in Supabase Storage. Make sure buckets are properly configured.
- **Data Validation:** Forms include basic validation. Additional validation can be added as needed.

## Troubleshooting

### Supabase Connection Issues

- Verify your environment variables are correct
- Check if your Supabase project is active
- Ensure you're using the anon key, not the service key

### Image Upload Failures

- Check if storage buckets exist
- Verify bucket policies allow uploads
- Ensure buckets are set to public for read access

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check for any missing dependencies

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.
