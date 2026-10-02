# Pitriciacle — Product Metafields

The theme reads six custom product metafields. Each renders **only when not blank**,
inside the `main-product` section's **"details"** block as a definition row
(label + value). The block's checkboxes (`show_material`, `show_dimensions`,
`show_weight`, `show_care`, `show_artisan`, `show_craft`) toggle each row.

## Definitions

| Namespace | Key | Type | Example value | Read by |
|---|---|---|---|---|
| `custom` | `material` | `single_line_text_field` | "Solid sheesham wood, hand-carved; brass inlay" | main-product → details |
| `custom` | `dimensions` | `single_line_text_field` | "H 120 × W 60 × D 4 cm" | main-product → details |
| `custom` | `weight` | `single_line_text_field` | "8.5 kg" | main-product → details |
| `custom` | `care_instructions` | `multi_line_text_field` | "Dust with a dry, soft cloth. Keep brass polished with a mild metal cleaner; avoid abrasive pads." | main-product → details |
| `custom` | `artisan_note` | `multi_line_text_field` | "Carved by the Sharma family workshop, Jodhpur — a third-generation frame-making atelier." | main-product → details |
| `custom` | `craft_story` | `multi_line_text_field` | "Each arch is cut from a single plank, joined without nails, then finished with natural wax…" | main-product → details |

> Keep values factual (materials, sizes, care). Do not invent awards, press quotes,
> or maker names you cannot verify — leave `artisan_note` blank rather than guessing.

## Setup (Shopify admin)

1. Go to **Settings → Custom data → Products**.
2. Click **Add definition** for each row above:
   - **Name:** e.g. "Material" · **Namespace and key:** `custom.material` (namespace `custom`, key `material`)
   - **Type:** as listed in the table.
3. Save each definition.
4. Open a product in **Products**, scroll to **Metafields**, and fill in the values.
5. On the product template, open the **main-product** section → **details** block and
   enable the rows you want to show (`show_material`, `show_dimensions`, etc.).
   Blank metafields never render, even when their toggle is on.

## Notes for the sections worker

- Access via `product.metafields.custom.material`, etc. — never assume presence.
- Render inside the existing `.pt-definition-list` styling (core CSS) as
  `<div><dt>Material</dt><dd>{{ ... }}</dd></div>` rows.
- Escape single-line values; allow line breaks for the multi-line fields.
