# Import Queue & Specifications Guide

## How the Import Queue Works

When you click **"Add to Queue"** on the preview page:

1. ✅ The phone data is added to your **Import Queue** (shown at the top in blue)
2. ✅ The form resets to the search page so you can add more phones
3. ✅ Your queued phones stay in the queue and are visible above the search bar
4. ✅ Once you've added all phones you want, click **"Save All to Database"** to import them

### Queue Status Flow

- **Pending** (Yellow) → Waiting to be saved to database
- **Saved** (Green) → Successfully imported to database
- **Failed** (Red) → Error during import (can retry)

---

## Specifications Grouping Structure

The scraper organizes specifications into **6 categories**:

### 📱 **Display**
- Display Size (e.g., "6.7 inches")
- Display Type (e.g., "AMOLED")
- Resolution (e.g., "2796 x 1290")
- Refresh Rate (e.g., "120 Hz")
- Glass Protection (e.g., "Gorilla Glass Armor")
- Brightness (e.g., "2000 nits peak")

### ⚡ **Performance**
- Processor/Chipset (e.g., "Snapdragon 8 Gen 3 Leading Version")
- CPU (Central Processing Unit)
- GPU (Graphics Processing Unit)
- RAM (e.g., "12GB")
- Storage (e.g., "256GB, 512GB")
- Card Slot (e.g., "microSD card")

### 📷 **Camera**
- Main Camera (e.g., "48 MP f/1.78 wide")
- Front Camera (e.g., "12 MP f/2.2")
- Video Recording (e.g., "4K @ 60fps")
- Camera Features (e.g., "OIS, AI enhancement")

### 🔋 **Battery**
- Battery Capacity (e.g., "4580 mAh")
- Battery Type (e.g., "Li-Ion")
- Fast Charging (e.g., "25W wired")
- Wireless Charging (e.g., "15W")

### 🔌 **Connectivity**
- Network (e.g., "5G, 4G LTE")
- SIM (e.g., "Dual SIM")
- WiFi (e.g., "WiFi 7")
- Bluetooth (e.g., "5.4")
- USB (e.g., "USB Type-C 3.1")
- NFC (e.g., "Yes")

### 🎨 **Design**
- Dimensions (e.g., "152.8 x 71.5 x 7.8 mm")
- Weight (e.g., "170g")
- Materials (e.g., "Glass, Titanium")
- Colors (e.g., "Black, White, Blue")
- Water Resistance (e.g., "IP68")

---

## Key Specifications vs Full Specifications

### **Key Specifications** (4 items)
These are the main highlights shown on product pages:
1. **Display** - Size and type
2. **Processor** - Chipset info
3. **Camera** - Main camera specs
4. **Battery** - Capacity info

Example Key Specs Preview:
```
📺 Display: 6.7" AMOLED 120Hz
⚙️ Processor: Snapdragon 8 Gen 3
📷 Camera: 48 MP f/1.78
🔋 Battery: 4580 mAh
```

### **Full Specifications** (30+ items)
Complete technical details stored in the database:
- All details from the 6 categories above
- Every technical spec from GSMArena
- Used in detailed product comparison pages
- Searchable and filterable

---

## Storage Variants & Colors

### **Storage Variants**
Automatically extracted from storage specifications:
- Example: `256GB`, `512GB`, `1TB`
- Each variant creates product combinations with each color

### **Colors**
Extracted from color specifications:
- Example: `Black`, `White`, `Blue`, `Midnight`, `Titanium Gray`
- **Product Variants** are created by combining: Storage × Color
  - Example: iPhone with 256GB + Black, 256GB + White, 512GB + Black, etc.

---

## How to Use the Import Page

### Step 1: Search
```
1. Enter phone name: "iPhone 16 Pro"
2. Click "Search"
3. Results appear from GSMArena
```

### Step 2: Select & Review
```
1. Click on the phone you want
2. Scraped data loads (Display, Processor, Camera, Battery, etc.)
3. Preview shows:
   - Phone name
   - 4 key specifications
   - 30+ detailed specifications
   - Storage options extracted
   - Available colors extracted
```

### Step 3: Edit (Optional)
```
1. Edit any phone name
2. Edit any specification value
3. Remove unwanted specs (🗑️)
4. Add/remove storage options
5. Add/remove colors
6. Select the brand from dropdown
```

### Step 4: Add to Queue
```
1. Click "Add to Queue"
2. Phone appears in the queue above
3. Form resets - ready for next phone
4. Repeat for more phones
```

### Step 5: Save All
```
1. Once all phones are queued
2. Click "Save All to Database"
3. All queued phones are saved
4. Auto-redirects to Products page
```

---

## Example: iPhone 16 Pro Import

### Scraped Data:
```
Name: Apple iPhone 16 Pro
Brand: Apple (selected)

KEY SPECS:
📺 Display: 6.7" Super Retina XDR AMOLED, 120Hz
⚙️ Processor: Apple A18 Pro 
📷 Camera: 48 MP f/1.78 main, 12 MP f/2.2 ultrawide
🔋 Battery: 3926 mAh

FULL SPECS (30+ items):
Display:
  - Display Size: 6.7 inches
  - Display Type: Super Retina XDR
  - Resolution: 2796 x 1290 pixels
  - Refresh Rate: 120 Hz
  - Glass Protection: Gorilla Glass Fusion

Performance:
  - Processor: Apple A18 Pro
  - RAM: 8GB
  - Storage: 128GB, 256GB, 512GB, 1TB

Camera:
  - Main Camera: 48 MP f/1.78 wide
  - Front Camera: 12 MP f/2.2
  - Video: 4K @ 120fps

[...more specs from Battery, Connectivity, Design categories...]

STORAGE: 128GB, 256GB, 512GB, 1TB
COLORS: Black Titanium, White Titanium, Rose Titanium, Gold Titanium
```

### Database Results:
✅ 1 Product created: "Apple iPhone 16 Pro"
✅ 4 Key specs saved
✅ 35+ Full specs saved
✅ 16 Product variants created (4 storage × 4 colors)

---

## Troubleshooting

### "No results found"
- Try searching with just brand: "Apple", "Samsung", "Google"
- Try full model: "iPhone 16 Pro Max"
- Check GSMArena directly for correct naming

### Queue disappeared
- Queue is always at the top of the page
- Check above the search form
- Scroll up if needed

### Edit didn't save
- Click "Add to Queue" to save your edits
- Edits are only applied when queued

### Import failed
- Check if brand is selected (required)
- Check phone name is valid
- Check specifications are properly formatted
- Look at error message for specific issue

---

## Database Schema

When a phone is imported, here's what's created:

```
products
  id: UUID
  brand_id: (selected brand)
  name: (phone name)
  slug: (auto-generated)
  description: (empty, can edit later)
  main_image: (empty, can add later)
  ...other fields

key_specifications
  id: UUID
  product_id: (linked product)
  icon: "display" | "processor" | "camera" | "battery"
  title: (e.g., "Display")
  value: (e.g., "6.7\" AMOLED 120Hz")
  sort_order: 0-3

specifications
  id: UUID
  product_id: (linked product)
  spec_group: ("Display" | "Performance" | "Camera" | "Battery" | "Connectivity" | "Design")
  spec_name: (e.g., "Display Size")
  spec_value: (e.g., "6.7 inches")
  sort_order: (auto-ordered by group)

product_variants
  id: UUID
  product_id: (linked product)
  storage: (e.g., "256GB")
  color: (e.g., "Black Titanium")
  color_hex: (auto-generated)
  sku: (auto-generated)
  is_available: true (default)
```

---

## Tips for Best Results

✅ **DO:**
- Search one phone at a time
- Review specs before adding to queue
- Add multiple phones in queue before saving
- Save all at once (more efficient)
- Edit specs if GSMArena data seems wrong

❌ **DON'T:**
- Queue duplicate phones (add same phone twice)
- Leave required fields empty (Brand dropdown)
- Import without reviewing specs first
- Edit after adding to queue (changes won't apply)

---

Need help? Check the scraper logs or contact support.
