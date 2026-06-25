# Chrome Web Store Listing — Collection Miner

> Last Updated: 2026-06-25

## Store Listing

**Extension Name**
Collection Miner

**Short Description** (90 chars — CWS max 132)
Rediscover forgotten bookmarks on every new tab, with a smart weighting system.

**Detailed Description**
Collection Miner turns your new tab page into a daily treasure hunt through your own saved browser bookmarks.

Every time you open a new tab, the extension randomly surfaces 3 items from your browser bookmarks. The more you interact with a card — liking, clicking, or disliking — the smarter the weighting becomes, so the content you love rises to the top and the items you dislike fade away.

Key features:

Bookmark Mining: Randomly displays 3 browser bookmarks on every new tab, drawn from your full bookmark library.

Dynamic Weight System: Like a card to increase its future appearance probability; dislike to reduce it. The extension tracks shows, clicks, and ratings to refine what you see over time.

Rarity Tiers: Items earn visual rarity badges based on your interactions — Legendary (gold border), Rare (purple/blue border), Common (white border), or Cursed (for deeply disliked items).

Age Tiers: Cards display a metallic luster based on how long ago they were saved — Gold (5yr+), Purple (3yr+), Blue (2yr+), Green (1yr+), White (new).

Premium Card Design: Each card features a 3D tilt effect driven by mouse movement, an interactive cursor-following spotlight halo, seamless flip animations, and three premium card-back themes (Royal Classic, Cyber Neon, Celestial Constellation).

Bilingual UI: Switch between Chinese and English interfaces with a single click.

Keyboard Shortcut: Press Enter to refresh the current 3 cards.

Data Backup: Export and import all your data (weights, history) as a local JSON file at any time.

Privacy: All data is stored locally on your device. Nothing is collected, transmitted, or shared. See our privacy policy for full details.

To get started, install the extension and open a new tab — your bookmarks will appear immediately.

For questions or feedback, visit the GitHub repository linked in the extension.

**Category**
Productivity

**Single Purpose**
Randomly surfaces bookmarks on every new tab, with a dynamic weighting system based on user interactions.

**Primary Language**
Chinese (zh-CN) — also fully supports English

---

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | icons/icon-128.png |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ✅ Ready | store-assets/screenshot-1-bookmarks.png |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ✅ Ready | store-assets/screenshot-2-editorial-cover.png |
| Small Promo Tile [RECOMMENDED] | 440×280 | ✅ Ready | store-assets/small-promo-tile.png |
| Marquee Promo Tile | 1400×560 | ✅ Ready | store-assets/marquee-promo-tile.png |

### Screenshot Notes
- Screenshot 1: Bookmarks on default card layout (Modern Magazine style) showing 3 cards in their rarity tiers
- Screenshot 2: Bookmarks on alternative layout (Editorial Book Cover style) showing elegant serif typography and layouts

---

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| bookmarks | permissions | The extension reads the user's browser bookmarks to randomly select and display 3 items on each new tab page. Without this permission, the core bookmark-mining feature cannot function. Bookmarks are never modified or transmitted off-device. |
| storage | permissions | The extension stores bookmark interaction weights (like/dislike counts, display history) and user preferences (selected layout, card-back theme, language) locally using Chrome's storage API. This data is never synced to Google servers or transmitted off-device. |
| tabs | permissions | The extension reads the URL of currently open tabs to detect duplicate "Collection Miner" new tab pages and offer a "Close Others" button when multiple instances are open. No tab content, page content, or browsing history is stored or transmitted. |

---

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All data is stored locally on the user's device using Chrome's `storage` API (local, not sync). No data is transmitted to external servers.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|-----------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No | No | — | No |

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

---

## Privacy Policy

**Privacy Policy URL** [REQUIRED]
https://holynova.github.io/collection_miner/

> ⚠️ ACTION NEEDED: Enable GitHub Pages in the repo settings (Settings → Pages → Source: Deploy from branch `main`, folder `/docs`). The privacy policy page will then be live at the URL above.

---

## Distribution

**Visibility**: Public
**Regions**: All regions
**Pricing**: Free

---

## Developer Info

**Publisher Name**: holynova

**Contact Email**: [FILL IN — your email address]

**Support URL**: https://github.com/holynova/collection_miner/issues

**Homepage URL**: https://github.com/holynova/collection_miner

---

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 0.4.0 | 2026-06-20 | Bookmarks-only layout refactoring; custom in-page delete confirmation; clean folder path breadcrumbs; Google serif/monospace fonts integration; layout style enhancements; card metadata layout & 3D parallax depth adjustments | Draft |
| 0.3.9 | 2026-06-15 | 3D Layered Card Layout with depth parallax; Spotlight Halo cursor-following glow per rarity tier | — |
| 0.3.8 | 2026-05-28 | Card Back Styles: 3 premium themes (Royal Classic, Cyber Neon, Celestial Constellation) | — |
| 0.3.0 | 2026-05-21 | UI Overhaul; More Menu; Empty States; Flip Animations; Enter hotkey | — |
| 0.2.0 | 2026-05-20 | Close Duplicate Tabs; Export/Import Backup | — |
| 0.1.0 | 2026-03-20 | Initial release — Bookmark Miner with dynamic weighting, rarity/age tiers | — |

---

## Review Notes

### Known Issues / Limitations
- The extension overrides the New Tab page (`chrome_url_overrides: newtab`). This is the primary function and is disclosed in the description.
- Google Fonts (Inter, Outfit) are loaded from `fonts.googleapis.com`. This is a standard CDN request for typefaces, not remote code execution.

### Rejection History
_(None yet — first submission)_
