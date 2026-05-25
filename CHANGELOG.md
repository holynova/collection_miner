# Changelog

All notable changes to this project will be documented in this file.

## 0.3.7 - 2026-05-25

### Fixes
- **GitHub Button Layout**: Fixed GitHub button styling by ensuring the SVG child does not shrink to 0 width under flexbox layout in the toolbar.
- **Empty Rating Display**: Refactored movie/book rating display to hide stars completely and remove rating-based border tier classes for unrated items.

---

## 0.3.6 - 2026-05-23

### Fixes
- **Movie Rating Stars & Tutorial Schema**: Corrected movie rating star count parsing to support star text formats (e.g. `"4星"`), and implemented automatic dataset-wide 5-point vs 10-point scale detection (e.g., mapping `"10"` to 5 stars, `"8"` to 4 stars). Updated the import guide examples in `tips.html` to align with the realistic exported JSON structure.

---

## 0.3.5 - 2026-05-23

### Fixes
- **Project Link Fix**: Corrected the recommended project repository URL from `scrape-to-markdown` to `scrape-to-markdown.chrome` in the Douban import tutorials.

---

## 0.3.4 - 2026-05-23

### Fixes
- **Movie Rating Stars Display**: Fixed rating parsing logic to support star strings (e.g. `"★★★★★"`) and Douban Chinese recommendation keywords (e.g. `"力荐"`), resolving the bug where 5-star items displayed empty rating stars and incorrect borders.

---

## 0.3.3 - 2026-05-23

### Features
- **Import Help Tutorial Panels**: Added collapsible info boxes next to the Douban file input labels showing the expected JSON layout and recommending the [scrape-to-markdown](https://github.com/holynova/scrape-to-markdown) Chrome extension.
- **Movie Title Optimization**: Modified the movie tabs card display to parse slash-separated movie titles and place foreign/secondary titles in a smaller secondary line below the main title.

---

## 0.3.2 - 2026-05-23

### Features
- **Typography Migration**: Transitioned the layout typography completely to modern, high-quality sans-serif families (Inter and Outfit) for a cleaner, unified UI.

---

## 0.3.1 - 2026-05-23

### Features
- **Dynamic 3D Card Reflections**: Added interactive cursor-following glare, sheen, and parallax lighting effects.
- **3-Layer Edge Highlights**: Added a multi-layered border clipping system to display clear level colors (white, green, blue, purple, gold) with interactive cursor-tracking highlights.
- **Mock Fallback Environment**: Added mock Chrome storage and bookmarks APIs to support full interactive layout testing in local `file://` development environments.

---

## 0.3.0 - 2026-05-21

### Features
- **UI Overhaul**: Redesigned tab layouts, refined typography, and adjusted information density for a premium visual experience.
- **More Menu**: Grouped secondary actions (export, backup, close others) into a clean, unified dropdown menu.
- **Empty States**: Added beautiful empty state placeholders for tabs without imported data.
- **Animations**: Refined the "Refresh" (再翻三张) animation to feature a seamless 3D flip effect.
- **Interactivity**: Added a loading state (debounce) to refresh buttons and supported pressing Enter to quickly fetch new cards.

---

## 0.2.0 - 2026-05-20

### Features
- Added "Close Others" button to quickly close all other duplicate Collection Miner tabs.
- Added one-click "Export Data" and "Import Backup" features to save and restore all imported Douban/Movie records and bookmarks interaction statistics.
- Improved duplicate tab detection robustness to handle `chrome://newtab/` schemes.
- Improved page styling with a dark-theme color scheme base to eliminate white background exposure during elastic scrolling bounce.

### Fixes
- Added `"tabs"` permission in manifest to resolve tab URL detection in the real browser.

---

## 0.1.0 - 2026-03-20

### Features
- Initial release of Bookmark Miner (Collection Miner).
- Tabbed interface separating Bookmarks, Douban Books/Movies with custom JSON importing.
- Classical tarot/playing card design theme with 3D hover tilt effects.
- Dynamic weighting system (likes/dislikes) and rarity/age lusters.
- Built-in English and Chinese bilingual support.
