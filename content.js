// content script runs on discord.com
// extracts token from localStorage and listens for scan requests

console.log('[discord-lattice] content script loaded');

// inject script into page context to access localStorage
function getToken() {
  return new Promise((resolve) => {
    console.log('[discord-lattice] attempting to get token...');

    // listen for response from injected script
    const handler = (e) => {
      if (e.data && e.data.type === 'DISCORD_LATTICE_TOKEN') {
        window.removeEventListener('message', handler);
        console.log('[discord-lattice] token received:', e.data.token ? 'yes' : 'no');
        resolve(e.data.token);
      }
    };
    window.addEventListener('message', handler);

    // inject script to run in page context
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        let token = null;
        try {
          token = localStorage.getItem('token');
          if (token) token = token.replace(/"/g, '');
        } catch(e) {
          console.log('[discord-lattice] localStorage error:', e);
        }
        window.postMessage({ type: 'DISCORD_LATTICE_TOKEN', token: token }, '*');
      })();
    `;
    document.documentElement.appendChild(script);
    script.remove();

    // timeout fallback
    setTimeout(() => {
      window.removeEventListener('message', handler);
      console.log('[discord-lattice] token request timed out');
      resolve(null);
    }, 1000);
  });
}

// listen for messages from popup asking for token or to start scan
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[discord-lattice] received message:', request.action);

  if (request.action === 'getToken') {
    getToken().then(token => sendResponse({ token }));
    return true;
  }

  if (request.action === 'scan') {
    console.log('[discord-lattice] starting scan...');

    getToken().then(token => {
      if (!token) {
        console.log('[discord-lattice] no token found');
        sendResponse({ error: 'Not logged into Discord' });
        return;
      }

      console.log('[discord-lattice] token found, scanning friends...');
      return scanFriends(token);
    }).then(data => {
      if (data) {
        console.log('[discord-lattice] scan complete, friends:', Object.keys(data).length);
        sendResponse({ data });
      }
    }).catch(err => {
      console.log('[discord-lattice] scan error:', err.message);
      sendResponse({ error: err.message });
    });

    return true; // keeps channel open for async response
  }
});

async function scanFriends(token) {
  const headers = { authorization: token };
  const data = {};

  console.log('[discord-lattice] fetching relationships...');
  const res = await fetch('https://discord.com/api/v9/users/@me/relationships', { headers });

  if (!res.ok) {
    console.log('[discord-lattice] relationships fetch failed:', res.status);
    throw new Error(`Failed to fetch relationships (${res.status})`);
  }

  const relationships = await res.json();
  const friends = relationships.filter(r => r.type === 1); // type 1 = friend
  console.log('[discord-lattice] found', friends.length, 'friends');

  // for each friend, get their mutuals
  for (let i = 0; i < friends.length; i++) {
    const friend = friends[i];
    const avatarUrl = friend.user.avatar
      ? `https://cdn.discordapp.com/avatars/${friend.id}/${friend.user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${friend.user.discriminator % 5}.png`;

    data[friend.id] = {
      username: friend.user.username,
      avatarUrl,
      id: friend.id,
      connections: []
    };

    // get mutuals for this friend
    const mutualRes = await fetch(`https://discord.com/api/v9/users/${friend.id}/relationships`, { headers });
    if (mutualRes.ok) {
      const mutuals = await mutualRes.json();
      data[friend.id].connections = mutuals.map(m => m.id);
    }

    // save progress incrementally
    chrome.storage.local.set({
      connections: data,
      scanProgress: { current: i + 1, total: friends.length }
    });

    // rate limit - 1 second between requests
    if (i < friends.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // clear progress when done
  chrome.storage.local.set({ scanProgress: null });

  return data;
}
