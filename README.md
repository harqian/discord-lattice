# Discord Lattice

Visualize your Discord friends network as an interactive graph. All data stays on your device.

## How It Works

1. Install the extension
2. Open Discord in your browser
3. Click the extension icon → "Scan Friends"
4. Click "View Graph" to explore your network

## Privacy & Security

- **No servers** — all processing happens locally in your browser
- **No token pasting** — uses your existing Discord session
- **No data transmission** — nothing leaves your device
- **Open source** — read every line of code yourself

### Verifying the code

After installing, you can verify the installed code matches this repo:

```bash
# find your extension's installed files
# Chrome: ~/Library/Application Support/Google/Chrome/Default/Extensions/
# look for the extension ID in chrome://extensions (enable Developer mode)

# compare against this repo
diff -r /path/to/installed/extension /path/to/this/repo
```

The extension has no build step — the JS files you see here are exactly what runs.

## Permissions Explained

| Permission | Why |
|---|---|
| `storage` | Save your graph data locally |
| `discord.com` | Run the scanner on Discord |
| `cdn.discordapp.com` | Load avatar images |

## Development

Load as unpacked extension:
1. Go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this folder

## Disclaimer

This uses Discord's undocumented API. Use at your own risk.
