# Velora

A customizable Chrome new tab extension with theme selector, quick access buttons, and dynamic wallpapers.

## Features

- **Glass Search Bar** — Glassmorphism search with subtle effects
- **Theme Selector** — 8 beautiful themes (Dark, Light, Auto, Rose, Ocean, Forest, Violet, Amber)
- **Quick Access Buttons** — Pre-configured for YouTube, GitHub, X, Instagram, Reddit, Netflix, Spotify, Gmail
- **Custom Shortcuts** — Add, edit, delete your own shortcuts
- **Dynamic Wallpapers** — Unsplash-powered backgrounds with category filtering
- **Smart Clock** — 12/24 hour format, seconds, date, and greeting
- **Search Engine Selector** — Google, Bing, DuckDuckGo, Brave Search
- **Settings Panel** — Comprehensive customization options
- **Keyboard Shortcuts** — Press `/` to search, `a` to add shortcut, `Escape` to close dialogs

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `velora` folder

### Production

Package the extension:
1. Go to `chrome://extensions/`
2. Click **Pack extension**
3. Select the `velora` folder as root directory

## Project Structure

```
velora/
├── manifest.json          # Extension manifest (v3)
├── index.html             # Main new tab page
├── css/
│   ├── base.css           # Variables, reset, typography
│   ├── glass.css          # Liquid glass effects
│   ├── themes.css         # Theme system & selector
│   ├── layout.css         # Page layout & responsive
│   ├── components.css     # UI components
│   └── responsive.css     # Media queries & accessibility
├── js/
│   ├── app.js             # Main entry point
│   ├── storage.js         # Chrome storage wrapper
│   ├── theme-engine.js    # Theme management
│   ├── wallpaper.js       # Wallpaper fetching & rotation
│   ├── clock.js           # Time display
│   ├── search.js          # Search functionality
│   ├── shortcuts.js       # Quick access & custom shortcuts
│   └── settings.js        # Settings dialog
└── assets/
    ├── icons/             # Extension icons (SVG + PNG)
    └── wallpapers/        # Local wallpaper fallbacks
```

## Customization

### Adding Quick Access Sites

Edit `js/shortcuts.js` and modify the `defaultQuickAccess` array:

```javascript
defaultQuickAccess: [
    { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: 'youtube', color: '#FF0000' },
    // Add your own:
    { id: 'mysite', name: 'My Site', url: 'https://mysite.com', icon: 'custom', color: '#123456' }
]
```

Add corresponding SVG icon to the `icons` object in the same file.

### Adding Themes

1. Add theme variables to `css/themes.css`:
```css
[data-theme="mytheme"] {
    --accent-primary: #yourcolor;
    --accent-primary-hover: #yourhover;
    --accent-primary-glow: rgba(yourcolor, 0.4);
}
```

2. Add theme option to `index.html` theme dropdown
3. Add theme preview styles in `css/themes.css`

### Wallpaper Categories

Modify `js/wallpaper.js` collections object to add/remove Unsplash collections.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search input |
| `a` | Add new shortcut |
| `Escape` | Close dialogs/dropdowns |
| `Arrow Keys` | Navigate dropdowns |

## Accessibility

- Full keyboard navigation
- ARIA labels and roles
- Reduced motion support
- High contrast support
- Focus visible states
- Screen reader compatible

## Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## License

MIT License — feel free to customize and share!