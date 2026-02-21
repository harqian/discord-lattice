# Discord Lattice - Debug Report

## Current State

**Problem:** Getting 401 Unauthorized when calling Discord API, even though we're extracting a token.

**Last Console Output:**
```
[discord-lattice inject] token length: undefined
[discord-lattice inject] fetching relationships...
GET https://discord.com/api/v9/users/@me/relationships 401 (Unauthorized)
```

The token length being `undefined` indicates the webpack extraction method is failing silently - it's returning `null` or `undefined` instead of the actual token string.

---

## Methods Tried

### 1. iframe localStorage (❌ Failed)
```javascript
const iframe = document.createElement('iframe');
document.body.appendChild(iframe);
const token = iframe.contentWindow.localStorage.getItem('token');
```
**Issue:** iframes don't share localStorage with parent page.

### 2. Inline script injection (❌ Failed)
```javascript
const script = document.createElement('script');
script.textContent = `...code...`;
```
**Issue:** Discord's CSP blocks inline scripts.

### 3. External script injection via web_accessible_resources (⚠️ Partial)
```javascript
script.src = chrome.runtime.getURL('inject.js');
```
**Issue:** Script runs but webpack method returns undefined token.

### 4. webpackChunkdiscord_app extraction (⚠️ Not Working)
```javascript
for (let e of Object.values(webpackChunkdiscord_app.push([[Symbol()], {}, e => e.c]))) {
  if (e.exports?.getToken) return e.exports.getToken();
  // ...
}
```
**Issue:** Returns undefined. Discord may have changed internal structure.

---

## Directions to Explore

### Option A: Use chrome.scripting.executeScript with world: 'MAIN'

Manifest V3 supports running scripts directly in the page context:

```javascript
// In background.js or popup.js (service worker context)
chrome.scripting.executeScript({
  target: { tabId: tabId },
  world: 'MAIN',  // runs in page context, not isolated world
  func: () => {
    return localStorage.getItem('token')?.replace(/"/g, '');
  }
}, (results) => {
  const token = results[0].result;
});
```

**Requires:**
- Add `"scripting"` permission to manifest
- Add background service worker to coordinate

### Option B: Network Request Interception

Hook into fetch/XHR to capture the Authorization header from Discord's own requests:

```javascript
// inject.js - run early on page load
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  if (options?.headers?.authorization) {
    window.__capturedToken = options.headers.authorization;
  }
  return originalFetch.apply(this, args);
};
```

Then wait for Discord to make any API request and capture the header.

**Pros:** Gets exact token format Discord uses
**Cons:** Requires Discord to make a request first; may miss it on first load

### Option C: Debug the webpack method

The webpack code might be failing because:
1. `webpackChunkdiscord_app` structure changed
2. The module with `getToken` is loaded lazily
3. The iteration is not finding the right module

Try this updated version (from Nov 2025):
```javascript
let token;
window.webpackChunkdiscord_app.push([[Symbol()], {}, o => {
  for (let e of Object.values(o.c)) {
    try {
      if (!e.exports || e.exports === window) continue;
      if (e.exports?.getToken) {
        token = e.exports.getToken();
        console.log("Found at exports.getToken");
      }
      for (let key in e.exports) {
        if (e.exports?.[key]?.getToken &&
            "IntlMessagesProxy" !== e.exports[key][Symbol.toStringTag]) {
          token = e.exports[key].getToken();
          console.log("Found at exports[" + key + "].getToken");
        }
      }
    } catch {}
  }
}]);
window.webpackChunkdiscord_app.pop();
```

### Option D: Direct localStorage (simplest)

The Discord Token Extractor extension just does:
```javascript
localStorage.token
```

This requires running in the MAIN world. Two ways:
1. `chrome.scripting.executeScript` with `world: 'MAIN'`
2. Inject script element with src (our current approach)

If the script is running in page context but `localStorage` is undefined, something else is wrong with how the script is being executed.

---

## Recommended Next Steps

1. **Add more debugging to inject.js:**
   ```javascript
   console.log('window.localStorage exists:', !!window.localStorage);
   console.log('webpackChunkdiscord_app exists:', typeof webpackChunkdiscord_app);
   ```

2. **Try chrome.scripting.executeScript approach:**
   - Add background.js service worker
   - Add "scripting" permission
   - Use `world: 'MAIN'` to run code in page context

3. **Verify script is actually in page context:**
   - Check if `window.discord` or other Discord globals are accessible
   - The fact that sentry logs show our messages suggests we ARE in page context

4. **Check if Discord changed token storage:**
   - Open Discord in browser
   - Open DevTools Console
   - Run `localStorage.token` directly
   - If that works, the issue is with how we're injecting/running code

---

## Reference: Working Console Commands

These work when pasted directly into Discord's DevTools console:

**Simple localStorage:**
```javascript
localStorage.token
```

**Webpack method (Nov 2025):**
```javascript
(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m).find(m=>m?.exports?.default?.getToken!==void 0).exports.default.getToken()
```

**Alternative webpack (Oct 2025):**
```javascript
(()=>{ for (let e of Object.values(webpackChunkdiscord_app.push([[Symbol()],{},e=>e.c]))) try { if (!e.exports||e.exports===window) continue; if (e.exports?.getToken) return e.exports.getToken(); for (let t in e.exports) if (e.exports?.[t]?.getToken&&"IntlMessagesProxy"!==e.exports[t][Symbol.toStringTag]) return e.exports[t].getToken()} catch {}})();
```
