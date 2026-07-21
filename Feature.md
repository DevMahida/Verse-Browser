# AI Browser Features

Welcome to the feature documentation for the AI Browser. This browser is built using Electron, Next.js, TailwindCSS, and Zustand, offering a modern, highly interactive, and synced browsing experience.

Below is a comprehensive list of functionalities available in the browser:

## 1. Core Browsing Experience
- **Chromium Engine:** Built on top of Electron's `WebContentsView` for secure, fast, and reliable web rendering.
- **Omnibox Search:** Intelligent URL bar that detects valid URLs and domains, and falls back to a Google search for plain text queries.
- **Navigation Controls:** Standard navigation operations including Back, Forward, Reload, and Home.
- **Find in Page:** Search for text within the current webpage (Ctrl+F / Cmd+F), complete with match highlighting, counts, and next/prev controls.
- **Page Zooming:** Zoom in, zoom out, or reset zoom on any webpage.
- **Print Support:** Native printing capabilities for web pages.
- **View Source:** Inspect the HTML source code of any webpage using `view-source:` protocol.

## 2. Advanced Tab Management
- **Multi-Tab Support:** Open, close, and navigate multiple webpages concurrently.
- **Drag-and-Drop Tabs:** Reorder tabs seamlessly within the tab bar (powered by `dnd-kit`).
- **Tab Pinning:** Pin important tabs to the left side of the tab bar to save space.
- **Split View:** View two tabs side-by-side simultaneously within the same window.
- **Recently Closed Tabs:** Ability to reopen recently closed tabs with their full history.
- **Tab Audio Controls:** Automatically detects audio playback. Easily mute or unmute individual tabs directly from the tab bar.
- **Tab Context Menu:** Right-click tabs to access quick actions: 
  - New Tab to the Right
  - Duplicate Tab
  - Pin/Unpin Tab
  - Mute/Unmute Tab
  - Close Other Tabs
  - Close Tabs to the Right
  - Open in New Window
  - Open in Incognito Window

## 3. Window Management & Proximity Features
- **Multi-Window Support:** Run multiple independent browser windows.
- **Tear-Off Tabs:** Drag a tab out of the tab bar downwards to spawn it into a brand new window. (Displays a transparent "mini-window" preview while dragging).
- **Tab Merge via Window Proximity:** Drag one browser window closely over another window's tab bar to automatically merge their tabs together.
- **Picture-in-Picture / Floating Windows:** Supports standard desktop window management (minimize, maximize, close).

## 4. Privacy & Security
- **True Incognito Mode:** Fully isolated sessions using Electron in-memory partitions. Incognito windows do not save history, downloads, or cache, and are isolated from normal windows.
- **Permissions Manager:** Site-specific permission prompts and toggles for Camera, Microphone, Notifications, and Geolocation. Manage active permissions in the Settings page.

## 5. Cloud Syncing (Firebase)
- **Google Authentication:** Sign in with your Google account natively.
- **Cross-Device Sync:** Your Bookmarks, Browsing History, AI Chat Sessions, and User Profile are automatically synced to the cloud via Firebase Firestore, accessible whenever you log in.
- **Multi-Account Support:** Seamlessly switch between different synced profiles.

## 6. History & Bookmarks
- **History Manager:** View all your past browsing activity sorted by date. Features clear history functionality.
- **Bookmarks Manager:** Save favorite pages with their favicons. Includes a toggleable Bookmarks Bar that can be set to show always or only on the New Tab page.

## 7. Downloads Management
- **Built-in Download Manager:** Track active and completed downloads in a dedicated pane.
- **Download Controls:** Pause, resume, cancel, or open the downloaded file/folder.
- **Download Settings:** Configure a default download directory or toggle "Ask where to save each file before downloading".

## 8. Customization & Theming
- **Light & Dark Mode:** Toggle between themes for comfortable viewing.
- **Modern UI:** Built with TailwindCSS and Lucide icons, featuring glassmorphism, smooth micro-animations, and a responsive React frontend.

## 9. Keyboard Shortcuts
Navigate like a pro with global keyboard shortcuts:
- `Ctrl/Cmd + T`: Open a New Tab
- `Ctrl/Cmd + W`: Close the active Tab
- `Ctrl/Cmd + F`: Find in Page
- `Ctrl/Cmd + H`: Open History
- `Ctrl/Cmd + J`: Open Downloads
- `Ctrl/Cmd + R`: Reload Page
- `F11`: Toggle Fullscreen

## 10. Extensions (Preview)
- **Mock Extension Store:** An interface to manage browser extensions and add-ons (currently in preview state).

## 11. AI Features (Verse Exclusive)
- **AI Sidebar:** Built-in AI chat sidebar powered by OpenRouter for on-the-fly assistance.
- **AI Chat Sync:** Chat sessions are synced via Firebase so you can continue conversations across devices.
- **Research Mode:** Enhanced AI assistance tailored for deep research tasks.
