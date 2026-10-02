# Pitriciacle Theme — Setup Guide

## 1. Install the theme
- **Via admin:** Online Store → Themes → Add theme → Upload zip file → select `pitriciacle-theme.zip` → Customize.
- **Via CLI:** `shopify theme push --unpublished` from the unzipped folder (requires Shopify CLI + store auth).

The theme looks finished on first install: every image falls back to a built-in
placeholder (`assets/IMAGES.md` lists each one), and all sections ship with demo presets.

## 2. Store basics
1. **Currency:** Settings → Store details → Store currency → **INR (₹)**. All prices in this theme are authored in INR.
2. **International:** Settings → Markets → add your target markets/regions. The theme is currency-agnostic (`money` filters) and will render converted prices automatically.
3. **Taxes & shipping:** Settings → Taxes and duties → configure GST for India; Settings → Shipping and delivery → set your zones/rates.

## 3. Catalog — create these collections and products
Create 4 collections (Online Store → Products → Collections), using these **handles**:

| Collection | Handle |
|---|---|
| Mirrors | `mirrors` |
| Lighting | `lighting` |
| Rugs & Runners | `rugs-runners` |
| Metal Objects | `metal-objects` |

Then create these 12 products (price in INR, assign each to its collection).
Use the matching `placeholder-product-*.jpg` as the product image until real photography is ready —
the product page auto-detects the product kind and shows the right placeholder.

| Product | Handle | Price (₹) | Collection |
|---|---|---|---|
| Rajwada Arch Mirror | `rajwada-arch-mirror` | 24,500 | mirrors |
| Mehtab Brass Mirror | `mehtab-brass-mirror` | 12,800 | mirrors |
| Jharokha Window Mirror | `jharokha-window-mirror` | 18,200 | mirrors |
| Diwan Table Lamp | `diwan-table-lamp` | 8,900 | lighting |
| Amber Pendant Light | `amber-pendant-light` | 14,500 | lighting |
| Noor Floor Lamp | `noor-floor-lamp` | 27,000 | lighting |
| Gulnar Wool Rug | `gulnar-wool-rug` | 32,000 | rugs-runners |
| Sahil Cotton Runner | `sahil-cotton-runner` | 6,400 | rugs-runners |
| Zarina Jute Rug | `zarina-jute-rug` | 4,200 | rugs-runners |
| Kansa Serving Bowl | `kansa-serving-bowl` | 3,800 | metal-objects |
| Peetal Urli Duo | `peetal-urli-duo` | 9,600 | metal-objects |
| Tamba Carafe Set | `tamba-carafe-set` | 5,400 | metal-objects |

Short description seeds (expand in your own voice):
- **Rajwada Arch Mirror** — a tall arched floor mirror in hand-carved sheesham; old-palace doorway proportions, made for entryways and dressing corners.
- **Mehtab Brass Mirror** — a round wall mirror ringed with brushed-brass inlay; moonlight, held still.
- **Jharokha Window Mirror** — arched jharokha panels in honey mango wood; a window that happens to reflect.
- **Diwan Table Lamp** — a brushed-brass dome lamp with a warm, low glow; evenings, softened.
- **Amber Pendant Light** — hand-blown amber glass on brass fittings; pours honeyed light over dining tables.
- **Noor Floor Lamp** — a tall brushed-brass arc with an ivory linen drum shade; a pillar of light for reading corners.
- **Gulnar Wool Rug** — hand-knotted New Zealand wool in muted rose and sage; a traditional motif, quieted down.
- **Sahil Cotton Runner** — handloom cotton in sand and ivory stripes; made for hallways that deserve better.
- **Zarina Jute Rug** — hand-braided round jute; honest texture underfoot.
- **Kansa Serving Bowl** — hand-beaten bronze (kansa); the alloy Indian kitchens have trusted for centuries.
- **Peetal Urli Duo** — a pair of hand-spun brass urlis; float flowers and candles, watch the room change.
- **Tamba Carafe Set** — hammered copper carafe with two glasses; water, served beautifully.

## 4. Product metafields (details shown on the product page)
See `METAFIELDS.md` for the full table. Quick path:
Settings → Custom data → Products → Add definition, create these six (namespace `custom`):

| Key | Type |
|---|---|
| `custom.material` | Single line text |
| `custom.dimensions` | Single line text |
| `custom.weight` | Single line text |
| `custom.care_instructions` | Multi-line text |
| `custom.artisan_note` | Multi-line text |
| `custom.craft_story` | Multi-line text |

Fill them per product; the product page "Details" block renders only the ones that have values.

## 5. Pages (assign the template shown in the page editor, right sidebar)
- **Our Craft** → template `page.craft` (craft story + editorial split + FAQ)
- **Heritage** → template `page.heritage` (editorial split + timeline + testimonials)
- **Contact** → template `page.contact` (contact form + FAQ)
- **FAQ** (optional standalone) → template `page` + add FAQ accordion section
- **Policies:** Settings → Policies → fill Privacy, Terms of Service, Shipping, Returns/Refunds. The theme renders them via the native `policy` template — no extra pages needed.

## 6. Menus & navigation
- Content → Menus → create **Main menu**: Home, Mirrors, Lighting, Rugs & Runners, Metal Objects, Our Craft, Heritage, Journal, Contact. Assign it in the Header section.
- Create a **Footer menu** (Shop, Our Craft, Heritage, Contact, FAQ, Shipping & Returns, Privacy, Terms) and assign it to a footer menu block.

## 7. Blog
Create a blog with handle `journal` (Content → Blog posts → Manage blogs) and assign it in the homepage Journal teaser section.

## 8. Replacing placeholder imagery
Every `placeholder-*.jpg` is an original AI-generated stand-in — no licensing issues, but they are
generic. `assets/IMAGES.md` lists each file, what it depicts, and what real photo should replace it.
Swap via the theme editor (section image pickers) or Files. Product images: upload to each product.

## 9. Theme settings worth reviewing
- **Announcement bar:** edit the message / add rotating messages.
- **Header:** upload a logo image if you ever make one (the Cormorant Garamond "Pitriciacle" wordmark is the default and needs nothing).
- **Colors:** the full Pitriciacle palette is preconfigured; change carefully — Champagne is reserved for accents.
- **Cart drawer:** the free-shipping progress bar threshold is set to **₹15,000** in `sections/cart-drawer.liquid`. If your shipping policy differs, update the threshold value in that file (search for `15000`).

## 10. Recommended apps / settings (optional)
- Reviews app (e.g. Judge.me) — the theme has no review widgets built in.
- A cookie-consent banner app if you serve the EU/UK.
- Keep "Dynamic checkout buttons" enabled on the product page for Shop Pay / UPI express options.

## 11. Luxury-commerce features — merchant setup

Eight features ship with the theme. Most work out of the box; a few need one-time setup:

**1. Wishlist** — works immediately. Heart toggles appear on product cards and product pages; the header heart (toggle under *Header → Show wishlist*) opens the wishlist drawer. Saved in the shopper's browser (localStorage), no account needed.

**2. Back-in-stock alerts** — toggle under *Product page → Show back-in-stock alerts* (default on). When a product is unavailable, shoppers leave an email; it arrives via your contact-form email tagged `back-in-stock-request` with the product title/handle included. *Klaviyo upgrade path:* install Klaviyo and replace this with their "Back in Stock" flow for automated restock emails — the theme form is the no-app starting point.

**3. Made-to-order / pre-order** — tag any product `made-to-order`. The add-to-bag button becomes "Pre-order" and a lead-time note appears underneath (edit the text under *Product page → Made-to-order lead time note*). Works with continue-selling inventory: set inventory policy to *Continue selling when out of stock* so the button stays live.

**4. Stylist enquiry (concierge)** — the "Speak to our stylist" button appears on products priced at/above the threshold (*Product page → Stylist enquiry price threshold*, default ₹20,000) or tagged `concierge`. Enquiries arrive via the contact form tagged `stylist-enquiry`.

**5. Gifting suite** — in the cart drawer: (a) create a product for gift wrap (e.g. "Signature gift wrap", ₹295, single variant, inventory tracked); (b) open the *Cart drawer* section in the editor and pick it under *Gift wrap product*. Shoppers ticking "Make it a gift" get the wrap line added automatically plus a gift-message field (saved as a cart attribute, visible on the order). Leave the product unpicked to capture only the message.

**6. Complete the room** — on the product page, add the "Complete the room" block and pick up to 3 complementary products. Shoppers tick what they want and add all with one tap; the total updates live.

**7. Trade program** — (a) create a page (Content → Pages) titled e.g. "Trade program" and assign it the `page.trade` template in the right sidebar; (b) add it to your footer menu (Content → Menus). Enquiries arrive tagged `trade-enquiry` with studio, GSTIN and volume included.

**8. Currency selector + white-glove delivery** — the country/currency selector appears in the header and footer once *Settings → Markets* has more than one market (toggles under *Header/Footer → Show country / currency selector*). For white-glove delivery, tag a product `white-glove`; a banner appears on its page with editable text (*Product page → White-glove delivery text*).
