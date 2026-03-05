# Hardware Requirements

## QR Code Label Printing

### Overview
Need to print ~102 QR code labels initially, scaling to ~200+ for the 10×20 unit. Labels must be:
- **Durable:** Survive storage unit conditions (humidity, temperature swings, dust)
- **Scannable:** High contrast, minimum 1" × 1" QR code size
- **Professional:** Clean, uniform appearance
- **Adhesive:** Stick to Sterilite lid surfaces (polypropylene plastic)

### Option 1: Regular Printer + Weatherproof Label Sheets (~$30-80)

**Hardware:**
- Use existing inkjet or laser printer
- Buy weatherproof label sheets

**Recommended Labels:**
- **Avery WeatherProof Labels** (60506 or similar) - ~$20-30 for 200 labels
- **OnlineLabels Weatherproof Polyester** - ~$25-40 for 200 labels
- Materials: Polyester or vinyl with UV-resistant coating
- Adhesive: Permanent, rated for outdoor use

**QR Code Size:**
- 2" × 2" or 3" × 3" labels (ensures easy scanning)
- Can fit multiple QR codes per sheet (print 6-12 at once)

**Pros:**
- Cheapest option if you have a printer
- Can print box names + QR code together
- Full color (can color-code by category)
- Easy to reprint if needed

**Cons:**
- Inkjet: May smudge/fade even with weatherproof labels (laser is better)
- Not as durable as thermal printing
- Cutting/peeling labels from sheets is tedious at scale
- Label alignment can be finicky

**Durability:** 2-5 years in storage conditions (laser better than inkjet)

**Best for:** Testing the system before investing in dedicated hardware, or if you already have a laser printer

---

### Option 2: Thermal Label Printer (~$150-250) **← RECOMMENDED**

**Hardware Options:**

#### MUNBYN ITPP941 (~$160-180)
- 4×6" thermal printer (shipping label size)
- Direct thermal (no ink/toner needed)
- USB + Bluetooth
- Works with standard 4×6" labels (cheap, $15-25 per 500)

#### Rollo Label Printer (~$200-230)
- Commercial-grade thermal printer
- 4×6" labels
- Very fast printing (3-5 seconds per label)
- Mac/Windows/Linux compatible
- Used by small businesses for shipping labels

#### JADENS Bluetooth Label Maker (~$140-160)
- Portable option
- 2-4" wide labels
- Battery powered (good for labeling in storage unit on-site)
- Thermal transfer (more durable than direct thermal)

**Labels:**
- **Direct thermal:** $15-25 per 500 labels (4×6")
- Fade over time (~2-3 years) but very cheap
- **Thermal transfer:** $30-50 per 500 labels + ribbon
- Much more durable (5-10+ years)

**Pros:**
- No ink/toner costs (just labels)
- Fast printing (3-5 seconds per label)
- Waterproof, tear-resistant labels available
- Professional appearance
- Can print barcode + QR code + text on same label
- Shipping label size (4×6") allows large QR codes + item preview
- Useful for other projects (shipping, organization)

**Cons:**
- Initial cost ~$150-250
- Direct thermal fades over time (heat/UV exposure)
- Most are single-color (black on white)
- Need to buy label rolls (but they're cheap)

**Durability:**
- Direct thermal: 2-3 years
- Thermal transfer: 5-10+ years

**Best for:** Your use case - durable, professional, reusable for other organization projects

**Specific Recommendation:** **Rollo Label Printer (~$220)** + **Thermal transfer labels** (~$40/500)
- Total cost: ~$260 for printer + first 500 labels
- Commercial quality, will last for years
- Cost per label: ~$0.08 (vs $0.15-0.30 for weatherproof inkjet labels)

---

### Option 3: Industrial Barcode/QR Printer ($500-1500)

**Examples:**
- Zebra ZD421 (~$500-700)
- Brother TD-4550TNWB (~$600-800)
- TSC TTP-225 (~$300-400)

**Pros:**
- Extremely durable labels (10+ years)
- High-speed printing
- Precise QR code generation
- Can handle rolls of thousands of labels
- Thermal transfer (permanent)

**Cons:**
- Overkill for 100-200 labels
- Expensive upfront cost
- Commercial-grade (designed for warehouses)
- Requires specific label formats/software

**Best for:** Commercial deployment (moving companies, storage facilities) where you're printing thousands of labels across multiple clients

**Verdict:** Not worth it for personal use, but consider if you pivot to B2B model

---

### Option 4: Handheld Label Maker ($50-150)

**Examples:**
- Brother P-touch (PT-D210, PT-D410) - $50-100
- Dymo LabelManager 280 - $70-100

**Pros:**
- Portable (label on-site)
- Durable laminated labels
- Easy to use
- Good for cable labels, small organization

**Cons:**
- **Too small for QR codes** - max label width is 0.5-1", QR codes need 1-2" minimum
- Slow (type each label individually)
- Expensive per-label cost (~$0.30-0.50)
- Not suitable for 100+ labels

**Verdict:** Skip this - QR codes are too small on these devices

---

## QR Code Scanning

### Option 1: Smartphone Camera (via PWA) **← RECOMMENDED**

**How it works:**
- Web app requests camera permission
- JavaScript QR scanner library (html5-qrcode, zxing, etc.)
- Point phone at QR code, instant scan

**Pros:**
- FREE (everyone has a phone)
- Modern phones have excellent cameras
- Works on both iOS and Android
- No additional hardware to carry
- Can take photos of items at same time

**Cons:**
- Requires good lighting in storage unit
- Slightly slower than dedicated scanner (~1-2 seconds)
- Need internet for cloud-based app (or PWA offline mode)

**Best for:** Your use case - you're already building a PWA, phone camera is sufficient

---

### Option 2: Dedicated Barcode Scanner ($50-200)

**Types:**

#### Bluetooth Scanner (~$50-100)
- Pairs with phone/tablet/laptop
- Point and shoot
- 1-2 second scan time
- Tera HW0002 (~$50-70) - good budget option

#### USB Wired Scanner (~$30-60)
- Plug into laptop
- Very fast scanning
- Honeywell Voyager 1200g (~$100) - industry standard

**Pros:**
- Faster scanning (0.5-1 second)
- Works in low light better
- More ergonomic for rapid scanning
- Works from farther distance (up to 12")

**Cons:**
- Additional cost
- One more device to carry/charge
- Phone camera is "good enough" for most use cases

**Best for:** If you're scanning 50+ boxes in one session regularly, or commercial deployment where speed matters

**Verdict:** Not necessary for personal use, but nice-to-have if you find phone scanning tedious

---

## Lighting (Often Overlooked!)

### Problem
Storage units are dark. QR scanning needs good lighting.

### Solution Options:

**Cheap:** Headlamp (~$15-30)
- Hands-free
- LED, very bright
- Already useful for moving/organizing

**Better:** LED Work Light (~$20-50)
- Rechargeable
- Magnetic base (stick to metal shelves)
- Much brighter than headlamp

**Best:** Phone flashlight + reflector
- Free if you use phone camera
- Most phones have powerful LED flash
- Turn on flashlight, prop phone, scan with second device (tablet)

**Recommendation:** Get a headlamp regardless - you'll need it for organizing in a dark storage unit

---

## Other Useful Hardware

### Label Applicator/Roller (~$10-20)
- Makes applying labels smooth and bubble-free
- Squeegee-style applicators work great on plastic
- Prevents peeling at corners

### Cable Ties (~$10 for 100)
- Your Sterilite bins have keyhole slots
- Can cable-tie a label holder to the bin (alternative to adhesive)
- Swappable labels without residue

### Portable Printer Stand/Table (~$20-40)
- If you get thermal printer
- Bring to storage unit, print labels on-site
- Easier than printing 100 labels at home and transporting

---

## Recommended Setup (Total: ~$260-300)

**For durable, professional system:**

1. **Rollo Label Printer** - ~$220
   - OR MUNBYN ITPP941 - ~$160 (budget option)

2. **Thermal Transfer Labels (4×6")** - ~$40 per 500
   - Get weatherproof/outdoor rated if available

3. **Thermal Transfer Ribbon** - ~$15-20
   - Needed for thermal transfer printing

4. **Headlamp** - ~$20
   - For lighting in storage unit

5. **Label Application Squeegee** - ~$10
   - Smooth application, no bubbles

**Total: ~$300 for everything**

**Per-label cost:** ~$0.08-0.10
**Durability:** 5-10+ years
**Print speed:** ~5 seconds per label
**Future use:** Shipping labels, product labels, general organization

---

## Budget Setup (Total: ~$50)

**For testing/MVP:**

1. **Weatherproof Label Sheets (Avery 60506)** - ~$30 for 200 labels
2. **Existing Laser Printer** - $0 (you already have one)
3. **Headlamp** - ~$20

**Total: ~$50**

**Per-label cost:** ~$0.15
**Durability:** 2-5 years (laser), 1-2 years (inkjet)
**Print speed:** 30-60 seconds per sheet (6-12 labels)

---

## Label Design Recommendations

### QR Code Size
- **Minimum:** 1" × 1" (scannable from 6-12" away)
- **Recommended:** 1.5" × 1.5" (scannable from 12-18" away)
- **Ideal:** 2" × 2" (scannable from 18-24" away, easy in low light)

### Label Layout (4×6" thermal label)

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────┐   BOX #042         │
│  │         │   Kitchen Gadgets  │
│  │   QR    │                    │
│  │  Code   │   Items: 12        │
│  │         │   Updated: 3/4/26  │
│  └─────────┘                    │
│   2" × 2"     Location: A3-L2   │
│                                 │
└─────────────────────────────────┘
```

**Includes:**
- Large QR code (2" × 2")
- Box number (e.g., #042)
- Box name/category
- Item count
- Last updated date
- Physical location (optional, update on web app instead)

### Alternative: Small 2" × 2" Label

If using small label printer or adhesive sheets:

```
┌──────────────┐
│  ┌────────┐  │
│  │        │  │
│  │   QR   │  │
│  │  Code  │  │
│  │        │  │
│  └────────┘  │
│  Box #042    │
│  Kitchen     │
└──────────────┘
```

---

## Final Recommendation: Brother PT-E560BTVP (~$300)

**Selected hardware:** Brother P-Touch EDGE PT-E560BTVP

**Why this works:**
- ✅ **Dual-use:** Storage bin QR labels (24mm) + automotive wire heat shrink labels
- ✅ **QR codes:** 24mm (0.95") is sufficient for close-range scanning (8-12")
- ✅ **Durable labels:** Laminated TZe tape lasts years in storage conditions
- ✅ **Heat shrink capability:** HSe tubes for 20-22 gauge automotive wire labeling
- ✅ **Portable:** Battery powered, label on-site at storage unit or garage
- ✅ **Bluetooth + USB-C:** Multiple connection options for printing

**Trade-offs vs. desktop thermal printer:**
- Smaller label size (24mm strip vs 4×6" sheet)
- Higher cost per label (~$0.50 vs ~$0.08 for thermal)
- Requires SDK/special software for web app integration (not standard printer driver)

**But worth it because:**
- Single device for multiple use cases
- More versatile for general organization (cables, tool boxes, electrical panels)
- Heat shrink wire labeling capability is unique and valuable

## Web App Integration Strategy

Since the PT-E560BTVP doesn't work as a "standard printer," here's how to integrate with your FastAPI + React/Vue web app:

### Option A: Backend Print Service (Recommended)

**Architecture:**
```
Web App (React/Vue) → FastAPI Backend → PT-E560BTVP (via USB-C or Bluetooth)
```

**Implementation:**
1. Install Python library for Brother P-touch on server/local machine
   - Try: `brother_ql` (if compatible) or use Brother SDK
2. FastAPI endpoint: `POST /api/labels/print`
   - Accepts: box_id, box_name, qr_data
   - Generates QR code image (Python: `qrcode` library)
   - Sends print command to PT-E560BTVP
3. Web app calls endpoint when user clicks "Print Label"

**Pros:**
- Clean separation of concerns
- QR generation handled server-side
- Works from any device (desktop, tablet, phone)

**Cons:**
- Printer must be connected to server/local machine running FastAPI
- Requires local backend if not cloud-hosted

### Option B: b-PAC SDK (Browser Extension)

**Architecture:**
```
Web App (JavaScript) → b-PAC Extension → PT-E560BTVP (via USB-C)
```

**Implementation:**
1. Install b-PAC Extension (Chrome/Firefox/Edge - Windows only)
2. Install b-PAC Client software
3. Use JavaScript library (e.g., `bpac-js`) in your React/Vue app
4. Generate QR codes in browser, send to printer

**Pros:**
- Direct browser-to-printer communication
- No backend required for printing

**Cons:**
- **Windows only**
- Requires browser extension installation on client
- More complex client-side setup

### Option C: Mobile App Workflow (Simplest for MVP)

**For initial testing:**
1. Generate QR codes in your web app
2. Display QR code + box name on screen
3. Use **Brother Pro Label Tool** mobile app
4. Manually recreate label and print via Bluetooth

**Upgrade path:**
- Later: Implement Option A or B for automated printing
- For now: Focus on web app functionality, print labels manually

## Recommended Labels & Supplies

**For storage bins:**
- **Brother TZe-251** (24mm, black on white, laminated) - ~$20-30 per 26ft roll
- Print ~100mm (4") labels per box
- One roll = ~80 labels

**For automotive wire:**
- **Brother HSe-231** (11.7mm heat shrink, black on white) - for 20-22 gauge wire
- **Brother HSe-221** (8.8mm heat shrink) - for smaller gauge wire
- 3:1 shrink ratio, rated to 257°F

**Total label cost:**
- Storage bins: ~$0.50 per label (TZe tape)
- Wire labels: ~$0.30-0.40 per label (HSe tape)

## Don't Buy

- Desktop thermal printers (already committed to PT-E560BTVP)
- Industrial barcode printers (overkill)
- Dedicated barcode scanners (phone camera is sufficient)

---

## Next Steps

1. **Order hardware** (thermal printer + labels)
2. **Test label durability** (apply one to a bin, leave in garage/outside for a week, test scanning)
3. **Design label template** in web app (print preview)
4. **Print first batch** (10-20 labels to test)
5. **Iterate** on design/size before printing all 100+
