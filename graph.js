// graph rendering - adapted from Mutuals project

const options = {
  physics: {
    enabled: true,
    barnesHut: {
      theta: 1,
      gravitationalConstant: -2000,
      centralGravity: 0.1,
      springLength: 255,
      springConstant: 0.02,
      damping: 0.08,
      avoidOverlap: 0
    },
    stabilization: {
      enabled: true,
      iterations: 1000,
      updateInterval: 100,
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

async function loadGraph() {
  const result = await chrome.storage.local.get(['connections']);
  const connections = result.connections;

  if (!connections || Object.keys(connections).length === 0) {
    document.getElementById('loading').textContent = 'No data. Scan friends first.';
    return;
  }

  connectionsData = connections;

  const data = { nodes: [], edges: [] };
  const links = new Set();

  // build nodes and collect edges
  for (const id in connections) {
    const friend = connections[id];
    data.nodes.push({
      id: parseInt(id),
      image: friend.avatarUrl,
      label: friend.username,
      title: friend.username // tooltip
    });

    // add edges for mutuals (dedupe by sorting ids)
    friend.connections.forEach(mutualId => {
      // only add edge if mutual is also in our friends list
      if (connections[mutualId]) {
        const edge = [id, mutualId].sort((a, b) => parseInt(a) - parseInt(b)).join('-');
        links.add(edge);
      }
    });
  }

  // convert edge set to array
  links.forEach(link => {
    const [from, to] = link.split('-');
    data.edges.push({ from: parseInt(from), to: parseInt(to) });
  });

  document.getElementById('loading').style.display = 'none';

  const container = document.getElementById('network');
  network = new vis.Network(container, data, options);

  // click handler for info card
  network.on('click', (params) => {
    if (params.nodes.length > 0) {
      showInfoCard(params.nodes[0]);
    } else {
      hideInfoCard();
    }
  });
}

function showInfoCard(nodeId) {
  const friend = connectionsData[nodeId];
  if (!friend) return;

  // count how many mutuals are also in our network
  const mutualCount = friend.connections.filter(id => connectionsData[id]).length;

  document.getElementById('card-avatar').src = friend.avatarUrl;
  document.getElementById('card-username').textContent = friend.username;
  document.getElementById('card-stats').textContent = `${mutualCount} mutual connections`;

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
  connectedIds.add(parseInt(nodeId));

  // dim nodes not connected
  const updates = [];
  for (const id in connectionsData) {
    const nid = parseInt(id);
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
    updates.push({ id: parseInt(id), opacity: 1.0 });
  }
  network.body.data.nodes.update(updates);
}

// close button for info card
document.querySelector('#info-card .close').addEventListener('click', hideInfoCard);

loadGraph();
