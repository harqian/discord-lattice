// runs in discord's page context
(function() {
  console.log('[discord-lattice inject] running in page context');

  // get token via webpack
  function getToken() {
    try {
      if (typeof webpackChunkdiscord_app !== 'undefined') {
        for (let e of Object.values(webpackChunkdiscord_app.push([[Symbol()], {}, e => e.c]))) {
          try {
            if (!e.exports || e.exports === window) continue;
            if (e.exports?.getToken) return e.exports.getToken();
            for (let t in e.exports) {
              if (e.exports?.[t]?.getToken) return e.exports[t].getToken();
            }
          } catch {}
        }
      }
    } catch(e) {
      console.log('[discord-lattice inject] webpack error:', e.message);
    }
    return null;
  }

  // listen for scan requests from content script
  window.addEventListener('message', async (e) => {
    if (e.data?.type === 'DISCORD_LATTICE_SCAN') {
      console.log('[discord-lattice inject] scan request received');

      const token = getToken();
      if (!token) {
        window.postMessage({ type: 'DISCORD_LATTICE_RESULT', error: 'No token found' }, '*');
        return;
      }

      console.log('[discord-lattice inject] token length:', token.length);

      try {
        // make fetch from page context with discord's own credentials
        const headers = { authorization: token };
        console.log('[discord-lattice inject] fetching relationships...');

        const res = await fetch('https://discord.com/api/v9/users/@me/relationships', { headers });
        console.log('[discord-lattice inject] status:', res.status);

        if (!res.ok) {
          window.postMessage({ type: 'DISCORD_LATTICE_RESULT', error: `API error: ${res.status}` }, '*');
          return;
        }

        const relationships = await res.json();
        const friends = relationships.filter(r => r.type === 1);
        console.log('[discord-lattice inject] found', friends.length, 'friends');

        const data = {};

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

          // get mutuals
          const mutualRes = await fetch(`https://discord.com/api/v9/users/${friend.id}/relationships`, { headers });
          if (mutualRes.ok) {
            const mutuals = await mutualRes.json();
            data[friend.id].connections = mutuals.map(m => m.id);
          }

          // report progress
          window.postMessage({
            type: 'DISCORD_LATTICE_PROGRESS',
            current: i + 1,
            total: friends.length
          }, '*');

          // rate limit
          if (i < friends.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        window.postMessage({ type: 'DISCORD_LATTICE_RESULT', data }, '*');
      } catch(err) {
        console.log('[discord-lattice inject] error:', err.message);
        window.postMessage({ type: 'DISCORD_LATTICE_RESULT', error: err.message }, '*');
      }
    }
  });

  // send ready signal
  window.postMessage({ type: 'DISCORD_LATTICE_READY' }, '*');
})();
