# Admin Panel - Quick Start Guide

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```
Edit `.env.local` and add your Supabase credentials.

### 3. Run Database Migrations
Execute the SQL files in order in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_enhance_schema.sql`
3. `supabase/migrations/003_sample_data.sql` (optional - adds sample data)

### 4. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000`

## 📱 Managing Product Data

### Complete Product Setup Flow

1. **Brands** → Create/manage phone manufacturers
2. **Stores** → Add retailers (Amazon, Noon, etc.)
3. **Products** → Create new phone model
4. **Product Details:**
   - **Images** → Upload product photos
   - **Variants** → Add storage/color combinations with hex codes
   - **Key Specs** → Add 4-6 top highlights
   - **Full Specs** → Add detailed specifications by category
   - **Ratings** → Add expert review scores with detailed feedback
5. **Prices** → Add prices for each variant at each store

## 🎨 Product Page Features (Based on Your Design)

### Storage & Color Selection
- **Variants Page**: Add all storage options (256GB, 512GB, 1TB)
- Add color names and hex codes (e.g., Natural Titanium #E8E3D9)
- System automatically groups and displays them on frontend

### Expert Ratings
- **Overall Score**: Main rating (e.g., 8.3/10)
- **Category Scores**:
  - Camera (8.0/10) + specific details
  - Battery (6.5/10) + specific details
  - Performance (9.5/10) + specific details
  - Display (9.4/10) + specific details
- **Pros & Cons**: Listed separately

### Key Specifications (Highlighted Section)
Add 4-6 key specs shown prominently:
- Display info
- Processor
- Storage options
- Battery capacity

### Full Specifications (Detailed Section)
Organized by categories:
- **Display**: Screen size, resolution, type, refresh rate
- **Performance**: Processor, RAM, storage, GPU
- **Camera**: Main, front, video recording
- **Battery**: Capacity, charging speeds
- **Connectivity**: Network, SIM, Wi-Fi, Bluetooth
- **Design**: Dimensions, weight, materials, colors

### Price Comparison
- Add prices from multiple stores
- System automatically finds and displays best price
- Shows delivery times and official seller badges
- Tracks price update dates

## 🔗 API Endpoints for Frontend

### Get Complete Product Data
```javascript
GET /api/products/[slug]

// Example: /api/products/iphone-16-pro
// Returns: All product data, variants, ratings, specs, prices
```

### Get Price Comparisons
```javascript
GET /api/products/[slug]/prices?storage=256GB&color=Natural%20Titanium

// Returns: Prices from all stores for specific variant
```

### Get Products List
```javascript
GET /api/products?page=1&limit=20&brand=apple

// Returns: Paginated product list with filters
```

## 📊 Admin Panel Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Overview |
| Brands | `/brands` | Manage manufacturers |
| Products | `/products` | Manage phone models |
| Edit Product | `/products/[id]/edit` | Edit basic info |
| Images | `/products/[id]/images` | Upload photos |
| Variants | `/products/[id]/variants` | Storage/color options |
| Key Specs | `/products/[id]/key-specs` | Top highlights |
| Full Specs | `/products/[id]/specs` | Detailed specs |
| Ratings | `/products/[id]/ratings` | Expert reviews |
| Stores | `/stores` | Manage retailers |
| Prices | `/prices` | Manage pricing |

## 💡 Quick Tips

### Adding iPhone 16 Pro (Example)
1. Create product "iPhone 16 Pro"
2. Add variants:
   - 256GB, Natural Titanium, #E8E3D9
   - 256GB, Blue Titanium, #5B7C99
   - 256GB, Black Titanium, #2C2C2E
   - 512GB, Natural Titanium, #E8E3D9
   - 1TB, Natural Titanium, #E8E3D9
3. Add key specs:
   - Display: "6.3\" OLED, 120Hz"
   - Processor: "Apple A18 Pro"
   - Storage: "256GB / 512GB / 1TB"
   - Battery: "3582 mAh, 25W fast charging"
4. Add expert ratings:
   - Overall: 8.3
   - Camera: 8.0 + "Solid cameras", "Extra lens options"
   - Battery: 6.5 + "Smaller battery capacity"
   - Performance: 9.5 + "High-end performance"
   - Display: 9.4 + "OLED display", "High refresh rate"
5. Add prices at Amazon, Noon, etc.

### Color Hex Codes
Common phone colors:
- Black: `#000000` or `#2C2C2E`
- White: `#FFFFFF` or `#F4F1EB`
- Natural Titanium: `#E8E3D9`
- Blue Titanium: `#5B7C99`
- Gold: `#FED7C3`

### Best Practices
✅ Use high-quality product images  
✅ Add all available storage/color combinations  
✅ Keep specs consistent across products  
✅ Update prices regularly  
✅ Add detailed rating explanations  
✅ Use 4-6 key specs for highlights  

## 📖 Full Documentation

For complete documentation, see [ADMIN_PANEL_GUIDE.md](./ADMIN_PANEL_GUIDE.md)

## 🐛 Troubleshooting

**Product not showing on frontend?**
- Check `is_active = true` in products
- Ensure variants are added
- Verify slug is correct

**Best price not updating?**
- Check that prices have `stock_status = 'in_stock'`
- Price updates automatically via database trigger

**Colors not displaying?**
- Add `color_hex` values to all variants
- Use format: #RRGGBB (e.g., #E8E3D9)

## 📞 Need Help?

Refer to the detailed guide: `ADMIN_PANEL_GUIDE.md`
