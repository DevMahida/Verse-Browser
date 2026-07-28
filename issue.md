# Open Issues & Feature Requests

This document tracks the remaining features, known bugs, and architectural limitations in Verse Browser compared to a full-fledged browser like Google Chrome.

## 🔴 High Difficulty / Blocked
*These features require deep system integration, complex external APIs, or significant architectural additions.*

- **Full WebExtensions API Support**: Currently using a Mock Extension Store. Transitioning to real Chromium extensions is highly limited in Electron.
- **Native Translation**: Full-page translation integration requires injecting a JS translation library into the DOM.
- **Safe Browsing Integration**: Active scanning for malicious websites requires integrating the Google Safe Browsing API without hitting rate-limits.
- **Live Caption**: Automatically generating captions for audio/video is not feasible with standard Web Speech APIs.

## 🟡 Medium Difficulty / Planned
*These features rely on standard Web/Electron technologies and are planned for future releases.*

- **Credential Manager**: Securely save, view, and manage passwords using Electron's `safeStorage`.
- **Form Autofill**: Automatically fill in addresses, credit cards, and passwords via content scripts.
- **Memory Saver (Sleeping Tabs)**: Automatically discard inactive tabs from memory to save RAM.
- **Tab Groups**: Allow users to group tabs, color-code them, name them, and collapse/expand groups.
- **Comprehensive Data Sync**: Expand Firebase sync to include Open Tabs, Passwords, Autofill Data, and Extensions.
- **Energy Saver Mode**: Reduce background activity and visual effects on laptops to extend battery life.

---

## ✅ Recently Resolved
*The following major issues have been successfully fixed in the latest versions.*

- **Custom Background Image Persistence**: Uploaded background images were failing to load across restarts. *Fixed by implementing Base64 Data URL conversion before saving to local state and Firebase.*
- **Cross-Profile Tab Merging**: Tabs from different isolated profiles were incorrectly merging when windows were dragged close to each other. *Fixed by implementing strict `_profileId` geometry checks.*
- **Window Drag Resizing Bug**: Rapidly dragging the window on fractional-scaling displays caused the window to infinitely grow. *Fixed by replacing `setPosition` with `setBounds` to lock dimensions during movement.*
- **Screen Reader Accessibility (ARIA)**: The custom React UI was invisible to screen readers. *Fixed by implementing standard ARIA roles (`tablist`, `tab`, `dialog`) and labels across all interactive elements.*
- **Safety Check Implementation**: Implemented a free, unlimited email breach monitor using the open-source XposedOrNot API, bypassing paid restrictions of other services.
