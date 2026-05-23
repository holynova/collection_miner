# Changelog

All notable changes to this project will be documented in this file.

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
