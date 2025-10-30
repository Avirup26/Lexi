# Lexi Icons

Extension icons for the Lexi Chrome Extension.

## Current Icons

All four required icon sizes are present:

- ✅ `icon16.png` - 16x16 pixels (toolbar icon)
- ✅ `icon32.png` - 32x32 pixels (Windows computers often require this size)
- ✅ `icon48.png` - 48x48 pixels (extension management page)
- ✅ `icon128.png` - 128x128 pixels (Chrome Web Store and installation)

## Icon Details

**Created by:** User-provided icons  
**Style:** Custom design for Lexi language learning extension  
**Colors:** Blue and white theme matching Lexi brand (#0ea5e9)  
**Symbol:** Book/language learning related imagery

## Usage

These icons are automatically copied to the `dist/icons/` folder during the build process and referenced in `manifest.json`:

```json
"icons": {
  "16": "icons/icon16.png",
  "32": "icons/icon32.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

## Design Guidelines

- Use simple, recognizable symbols
- Ensure good contrast for visibility
- Make icons work well at small sizes
- Consider using the primary blue color (#0ea5e9) from the brand
- Keep file sizes optimized (< 50KB per icon recommended)

## Note on File Sizes

Current icons are larger than optimal for web use. Consider optimizing with tools like:
- ImageOptim (Mac)
- TinyPNG (online)
- pngquant (command line)

Target sizes: icon16 (~2KB), icon32 (~5KB), icon48 (~10KB), icon128 (~30KB)
