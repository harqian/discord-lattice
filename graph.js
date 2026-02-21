// graph rendering - adapted from Mutuals project

const options = {
  physics: {
    enabled: true,
    barnesHut: {
      theta: 1,
      // Pull nodes into a tighter cluster (less repulsion + shorter springs).
      gravitationalConstant: -2000,
      centralGravity: 1.5,
      springLength: 140,
      springConstant: 0.04,
      damping: 0.24,
      avoidOverlap: 0
    },
    stabilization: {
      enabled: true,
      iterations: 800,
      updateInterval: 10,
      fit: true
    },
    adaptiveTimestep: true
  },
  layout: {
    randomSeed: 0,
    improvedLayout: true,
    clusterThreshold: 50
  },
  nodes: {
    borderWidth: 5,
    size: 45,
    color: {
      border: '#212121',
      background: '#666666'
    },
    font: {
      color: '#dcddde',
      face: 'system-ui, sans-serif',
      size: 16,
      strokeWidth: 3,
      strokeColor: '#1a1a1a'
    },
    brokenImage: 'https://cdn.discordapp.com/embed/avatars/5.png',
    shape: 'circularImage'
  },
  edges: {
    color: { color: '#444', highlight: '#5865f2' },
    width: 1
  },
  interaction: {
    hover: true,
    tooltipDelay: 100
  }
};

let network = null;
let connectionsData = null;
const loadingEl = document.getElementById('loading');
const loadingTextEl = document.getElementById('loading-text');
const defaultAvatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getDisplayName(friend) {
  return friend.displayName || friend.globalName || friend.username || 'Unknown User';
}

function getTag(friend) {
  if (friend.tag) return friend.tag;
  if (friend.discriminator && friend.discriminator !== '0') {
    return `${friend.username}#${friend.discriminator}`;
  }
  return `@${friend.username}`;
}

function getProfileUrl(friend) {
  return friend.profileUrl || `https://discord.com/users/${friend.id}`;
}

function setLoadingText(text) {
  if (loadingTextEl) loadingTextEl.textContent = text;
}

function hideLoading() {
  if (loadingEl) loadingEl.classList.add('hidden');
}

async function loadGraph() {
  try {
    const result = await chrome.storage.local.get(['connections']);
    const connections = result.connections;

    if (!connections || Object.keys(connections).length === 0) {
      setLoadingText('No data. Scan friends first.');
      return;
    }

    connectionsData = connections;

    const data = { nodes: [], edges: [] };
    const links = new Set();
    const ids = Object.keys(connections);
    const totalNodes = ids.length;

    // build nodes and collect edges
    for (let i = 0; i < totalNodes; i++) {
      const id = ids[i];
      const friend = connections[id];
      const displayName = getDisplayName(friend);
      const tag = getTag(friend);

      data.nodes.push({
        id: Number(id),
        image: friend.avatarUrl || defaultAvatarUrl,
        label: displayName,
        title: `${escapeHtml(displayName)}\n${escapeHtml(tag)}`
      });

      // add edges for mutuals (dedupe by sorting ids)
      friend.connections.forEach(mutualId => {
        // only add edge if mutual is also in our friends list
        if (connections[mutualId]) {
          const edge = [id, mutualId].sort((a, b) => Number(a) - Number(b)).join('-');
          links.add(edge);
        }
      });

      if (i % 25 === 0 || i === totalNodes - 1) {
        setLoadingText(`Preparing graph data... ${i + 1}/${totalNodes} users`);
      }
    }

    // convert edge set to array
    setLoadingText(`Building edges... ${links.size} found`);
    links.forEach(link => {
      const [from, to] = link.split('-');
      data.edges.push({ from: Number(from), to: Number(to) });
    });

    setLoadingText(`Rendering graph... ${data.nodes.length} nodes, ${data.edges.length} edges`);
    const container = document.getElementById('network');
    network = new vis.Network(container, data, options);

    const stabilizationEnabled = options.physics?.enabled && options.physics?.stabilization?.enabled;
    if (stabilizationEnabled) {
      network.on('stabilizationProgress', ({ iterations, total }) => {
        const pct = Math.max(0.1, Math.min(99.9, (iterations / total) * 100));
        setLoadingText(`Stabilizing layout... ${pct.toFixed(1)}%`);
      });

      network.once('stabilizationIterationsDone', () => {
        // Freeze layout once stabilized for better runtime performance.
        network.setOptions({ physics: { enabled: false } });
        setLoadingText('Stabilizing layout... 100%');
        hideLoading();
      });
    } else {
      network.once('afterDrawing', () => hideLoading());
    }

    // click handler for info card
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        showInfoCard(params.nodes[0]);
      } else {
        hideInfoCard();
      }
    });
  } catch (err) {
    setLoadingText(`Failed to load graph: ${err.message}`);
  }
}

function showInfoCard(nodeId) {
  const friend = connectionsData[nodeId];
  if (!friend) return;

  // count how many mutuals are also in our network
  const mutualCount = friend.connections.filter(id => connectionsData[id]).length;

  document.getElementById('card-avatar').src = friend.avatarUrl || defaultAvatarUrl;
  document.getElementById('card-avatar').onerror = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = defaultAvatarUrl;
  };
  document.getElementById('card-username').textContent = getDisplayName(friend);
  document.getElementById('card-tag').textContent = getTag(friend);
  document.getElementById('card-stats').textContent = `${mutualCount} mutual connections`;
  document.getElementById('card-open').href = getProfileUrl(friend);

  document.getElementById('info-card').classList.add('visible');

  // highlight this node's connections
  highlightConnections(nodeId);
}

function hideInfoCard() {
  document.getElementById('info-card').classList.remove('visible');
  resetHighlight();
}

function highlightConnections(nodeId) {
  const friend = connectionsData[nodeId];
  if (!friend) return;

  const connectedIds = new Set(friend.connections.map(id => parseInt(id)));
  connectedIds.add(Number(nodeId));

  // dim nodes not connected
  const updates = [];
  for (const id in connectionsData) {
    const nid = Number(id);
    if (connectedIds.has(nid)) {
      updates.push({ id: nid, opacity: 1.0 });
    } else {
      updates.push({ id: nid, opacity: 0.15 });
    }
  }

  network.body.data.nodes.update(updates);
}

function resetHighlight() {
  const updates = [];
  for (const id in connectionsData) {
    updates.push({ id: Number(id), opacity: 1.0 });
  }
  network.body.data.nodes.update(updates);
}

// close button for info card
document.querySelector('#info-card .close').addEventListener('click', hideInfoCard);

loadGraph();
