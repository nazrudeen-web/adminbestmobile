# Product Specifications Editor - Quick Guide

## How to Edit Specifications

You can now fully edit specifications on the product specs page. Here's how:

### 1️⃣ Access Specifications Page

- Go to **Products** → Find your product → Click **View/Edit** → **Specifications** tab
- Or navigate directly to: `/products/[product-id]/specs`

### 2️⃣ View Current Specifications

Specifications are organized by category:
- **Display** - Screen info
- **Performance** - Processor, RAM, Storage
- **Camera** - Camera specs
- **Battery** - Battery info
- **Connectivity** - Network, 5G, WiFi, Bluetooth
- **Design** - Dimensions, Weight, Materials

### 3️⃣ Edit a Specification

**To edit a spec:**

1. Find the spec you want to edit
2. Click the **Edit (pencil) icon** ✏️
3. The spec opens in edit mode with fields:
   - **Specification Name** (e.g., "Screen Size")
   - **Specification Value** (e.g., "6.7 inches")
   - **Category** (dropdown to change group)
   - **Sort Order** (number for ordering)
4. Make your changes
5. Click **"Save Changes"** button
6. Spec updates immediately ✅

### 4️⃣ Delete a Specification

1. Find the spec to delete
2. Click the **Trash icon** 🗑️
3. Confirm deletion in popup
4. Spec is removed ✅

### 5️⃣ Add New Specification

**To add a new spec:**

1. Go to **"Add New Specification"** form at top
2. Fill in:
   - **Group** (select category from dropdown)
   - **Name** (e.g., "Brightness")
   - **Value** (e.g., "2000 nits")
   - **Sort Order** (optional, for ordering)
3. Click **"Add Specification"**
4. New spec appears in correct category ✅

---

## Example Workflows

### Example 1: Fix Typo in Spec Value

**Before:** "Display: 6.7 inche"  
**After:** "Display: 6.7 inches"

1. Click ✏️ pencil icon on the spec
2. Fix the typo in "Specification Value"
3. Click "Save Changes"

### Example 2: Move Spec to Different Category

**Scenario:** "Gorilla Glass" is in Performance but should be in Design

1. Click ✏️ on the spec
2. Change "Category" dropdown from "Performance" to "Design"
3. Click "Save Changes"
4. Spec moves to Design category automatically

### Example 3: Add Missing Specifications

**Goal:** Add GPU and RAM details to Performance section

1. Scroll to "Add New Specification" form
2. Set:
   - Group: "Performance"
   - Name: "GPU"
   - Value: "Adreno 8"
   - Sort Order: 2
3. Click "Add Specification"
4. Repeat for RAM, CPU, etc.

---

## Categories Explained

| Category | What Goes Here |
|----------|----------------|
| **Display** | Screen size, resolution, refresh rate, brightness, AMOLED/LCD type, glass protection |
| **Performance** | Processor/Chipset, RAM, Storage, GPU, CPU cores, AnTuTu score, memory type |
| **Camera** | Main camera MP, aperture, telephoto, selfie camera, video recording capabilities, OIS |
| **Battery** | Capacity (mAh), type (Li-Ion), fast charging (watts), wireless charging, battery lifespan |
| **Connectivity** | 5G, 4G LTE, WiFi type (WiFi 6, WiFi 7), Bluetooth version, USB type, NFC support, SIM type |
| **Design** | Dimensions (mm), weight (g), materials (glass, metal), color options, water resistance (IP rating) |

---

## Tips

✅ **Best Practices:**
- Use consistent units: "256GB" not "256 GB" or "256gb"
- Use proper casing: "Snapdragon" not "snapdragon"
- Be specific: "48 MP f/1.8" not just "48 MP"
- Match category: Display specs go in Display, not Performance
- Keep values concise: "AMOLED 120Hz" not "It has an AMOLED display with 120Hz refresh rate"

❌ **Avoid:**
- Empty values (always fill Spec Value)
- Overly long values (keep reasonable length)
- Random categories (think about what category each spec belongs)
- Duplicate specs (don't add same spec twice)
- Irrelevant information (stick to technical specs)

---

## Database Updates

When you edit and save a specification:

1. ✅ The spec updates in real-time in the database
2. ✅ No page reload needed
3. ✅ Changes appear immediately
4. ✅ Changes are visible on product detail pages
5. ✅ Changes affect product comparisons

---

## Keyboard Shortcuts

Currently supported:
- **Tab** - Move between fields while editing
- **Enter** - Submit form (when in Add New Specification)

Potential future additions:
- **Ctrl+S** - Save current edit
- **Escape** - Cancel edit

---

## Troubleshooting

### "Save Changes button is disabled"
- Ensure all required fields have values
- Check that you've made at least one change
- Refresh page and try again

### "Changes not showing after save"
- Wait a moment for database to update
- Refresh the page
- Check browser console (F12) for errors

### "Can't edit a specification"
- Try clicking the pencil icon again
- Make sure you're not already editing another spec
- Refresh and try again

### "Accidentally deleted a spec"
- Unfortunately there's no undo (database delete is permanent)
- You'll need to add it again using "Add New Specification"
- Be careful with the trash icon!

---

## Integration with Product Page

After editing specs here, they automatically:

1. ✅ Appear in product detail view
2. ✅ Show in product comparison
3. ✅ Become searchable/filterable
4. ✅ Update in customer views
5. ✅ Sync across all pages

No separate save or publish needed - changes are live immediately!

---

## Related Pages

- **Product Edit**: `/products/[id]/edit` - Edit name, brand, images
- **Key Specs**: `/products/[id]/key-specs` - Edit 4 main specs
- **Variants**: `/products/[id]/variants` - Edit storage & color options
- **All Products**: `/products` - View all products

---

## Next Steps

After editing specs:

1. **Check product preview** - See how specs look to customers
2. **Add more specs** if needed
3. **Edit other sections** (images, variants, pricing)
4. **Publish/Activate** product when ready

---

**Need help?** Check [SPECS_EDITING_GUIDE.md](./SPECS_EDITING_GUIDE.md) for detailed editing workflows.
