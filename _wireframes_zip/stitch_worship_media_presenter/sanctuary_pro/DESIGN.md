# Design System Specification: The Ethereal Stage

## 1. Overview & Creative North Star
**Creative North Star: "The Silent Conductor"**

In the hushed, low-light environment of a sanctuary, the interface must not compete with the service; it must facilitate it with invisible precision. This design system moves away from the "clunky broadcast software" aesthetic, embracing a **High-End Editorial** approach. We achieve this through **Atmospheric Depth**—using tonal layering instead of harsh lines— and **Intentional Asymmetry**, where whitespace (negative space) acts as a structural element to guide the operator’s eye during high-pressure live moments. 

The goal is a "Glass-on-Navy" aesthetic that feels premium, calm, and authoritative. By prioritizing high-contrast legibility and a sophisticated dark-palette, we ensure the UI remains readable in the back of a dim room without causing "screen bleed" light pollution.

---

## 2. Colors
This palette is anchored in deep, cinematic navies and slate greys, designed to recede into the shadows while making content pop.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To separate a sidebar from a main stage or a media bin from a preview window, use background shifts. 
*   Place a `surface-container-low` section against a `surface` background. 
*   Use `surface-container-highest` for active interaction zones.
*   **The "Ghost Border" Fallback:** If a container requires a boundary for accessibility, use the `outline-variant` token at **15% opacity**. Never use a 100% opaque stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of semi-transparent materials.
*   **Base Layer:** `surface` (#0b1326) – The foundation.
*   **Secondary Zones:** `surface-container-low` (#131b2e) – Navigation rails and backgrounds.
*   **Interactive Cards:** `surface-container` (#171f33) – The default state for media items.
*   **Elevated/Active State:** `surface-container-high` (#222a3d) – Hover states or active selections.

### The "Glass & Gradient" Rule
For "Live" status indicators and primary actions, utilize **Signature Textures**. 
*   **CTA Gradients:** Instead of flat `primary`, use a linear gradient from `primary` (#bbc3ff) to `primary_container` (#001d92) at a 135-degree angle. This adds a "soul" to the button that feels illuminated, not just colored.
*   **Glassmorphism:** For overlays (Modals, Tooltips), use `surface_container_highest` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography
We pair the geometric precision of **Manrope** for high-level display with the utilitarian clarity of **Inter** for data-heavy operations.

*   **Display (Manrope):** Use `display-lg` and `headline-md` for current slide lyrics or "Now Playing" headers. The wide tracking and variable weight of Manrope feel editorial and modern.
*   **Functional (Inter):** Use `body-md` and `label-sm` for technical metadata (timestamps, file sizes, slide numbers). 
*   **Hierarchy Tip:** Always use `on_surface_variant` (#c6c5d4) for secondary metadata to ensure the `on_surface` (#dae2fd) primary text remains the undisputed hero of the visual hierarchy.

---

## 4. Elevation & Depth
In a dark mode sanctuary app, traditional drop shadows can look muddy. We use **Tonal Layering**.

*   **The Layering Principle:** To lift a "Media Property" panel, do not add a shadow. Instead, place the panel (using `surface-container-lowest`) on top of the main workspace (`surface-container`). The slight dip in brightness creates a natural, sophisticated inset look.
*   **Ambient Glow:** For floating elements like a "Go Live" HUD, use a shadow with a blur of `32px`, an opacity of `8%`, and a color derived from `surface_tint` (#bbc3ff). This mimics the way light catches a physical edge in a dark room.

---

## 5. Components

### Buttons
*   **Primary (Live/Action):** Roundedness `md` (0.375rem). Use the Signature Gradient. Text is `on_primary_fixed`.
*   **Secondary (Edit/Manage):** Ghost style. No background fill, `outline-variant` Ghost Border (20% opacity), text in `primary_fixed_dim`.
*   **Tertiary (Utility):** `surface-container-highest` background, no border.

### Media Cards & Lists
*   **No Dividers:** Lists must never use horizontal lines. Use `8px` of vertical whitespace and a subtle background shift (`surface-container-low` to `surface-container`) on hover.
*   **The "Live" Card:** When a slide is live, give it a `2px` left-accent border using `tertiary` (#ffb3b3) and a subtle `surface-tint` inner glow.

### Form Elements
*   **Inputs:** Use `surface-container-lowest` as the fill. This creates a "sunken" feel that indicates an editable area.
*   **Focus State:** Instead of a thick border, use a `1px` stroke of `primary` and a soft `2px` outer glow.

### Specialized Worship Components
*   **The 'Live' Status Pill:** A high-contrast pill using `tertiary_container` (#670014) background with `tertiary` (#ffb3b3) text. Apply a subtle pulse animation to the background opacity (80% to 100%).
*   **The Verse Navigator:** A horizontal chip-list using `secondary_container`. Active verses take the `inverse_surface` color for maximum "at-a-glance" recognition by the operator.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `surface-dim` for background areas that should disappear into the bezel of the monitor.
*   **Do** use `manrope` for large numerical values (e.g., Countdown Timers) to give them a premium, "Swiss-design" feel.
*   **Do** embrace generous padding. A crowded interface leads to mistakes during a live service.

### Don't
*   **Don't** use pure black (#000000). It causes "smearing" on many display panels and feels "cheap" rather than "premium." Use our `background` (#0b1326).
*   **Don't** use 1px solid lines for grids. It creates visual noise that distracts from the worship content.
*   **Don't** use high-vibrancy greens for "Live." Our `tertiary` (#ffb3b3) and `primary` palette is curated for a sophisticated, cinematic look—avoid "traffic light" colors.