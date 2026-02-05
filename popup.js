console.log('[discord-lattice popup] loaded');

const scanBtn = document.getElementById('scan');
const viewBtn = document.getElementById('view');
const clearBtn = document.getElementById('clear');
const status = document.getElementById('status');
const progress = document.getElementById('progress');

// check if we have existing data
chrome.storage.local.get(['connections', 'scanProgress'], (result) => {
  if (result.connections && Object.keys(result.connections).length > 0) {
    const count = Object.keys(result.connections).length;
    status.textContent = `${count} friends scanned`;
    viewBtn.disabled = false;
  }

  // show ongoing progress if any
  if (result.scanProgress) {
    const { current, total } = result.scanProgress;
    progress.textContent = `Scanning: ${current}/${total}`;
    scanBtn.disabled = true;
  }
});

// poll for progress updates during scan
let progressInterval = null;

function startProgressPolling() {
  progressInterval = setInterval(() => {
    chrome.storage.local.get(['scanProgress', 'connections'], (result) => {
      if (result.scanProgress) {
        const { current, total } = result.scanProgress;
        progress.textContent = `Scanning: ${current}/${total}`;
      } else {
        // scan finished
        clearInterval(progressInterval);
        progress.textContent = '';
        scanBtn.disabled = false;

        if (result.connections) {
          const count = Object.keys(result.connections).length;
          status.textContent = `${count} friends scanned`;
          viewBtn.disabled = false;
        }
      }
    });
  }, 500);
}

scanBtn.addEventListener('click', async () => {
  console.log('[discord-lattice popup] scan clicked');

  // find discord tab
  const tabs = await chrome.tabs.query({ url: 'https://discord.com/*' });
  console.log('[discord-lattice popup] discord tabs found:', tabs.length);

  if (tabs.length === 0) {
    status.textContent = 'Please open Discord first';
    return;
  }

  console.log('[discord-lattice popup] using tab:', tabs[0].id, tabs[0].url);

  scanBtn.disabled = true;
  status.textContent = 'Starting scan...';
  progress.textContent = 'Scanning: 0/?';

  startProgressPolling();

  // send message to content script
  chrome.tabs.sendMessage(tabs[0].id, { action: 'scan' }, (response) => {
    console.log('[discord-lattice popup] got response:', response);

    if (chrome.runtime.lastError) {
      console.log('[discord-lattice popup] runtime error:', chrome.runtime.lastError);
      status.textContent = 'Error: Refresh Discord and try again';
      scanBtn.disabled = false;
      clearInterval(progressInterval);
      progress.textContent = '';
      return;
    }

    if (response && response.error) {
      console.log('[discord-lattice popup] scan error:', response.error);
      status.textContent = `Error: ${response.error}`;
      scanBtn.disabled = false;
      clearInterval(progressInterval);
      progress.textContent = '';
    }
    // success is handled by progress polling
  });
});

viewBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('graph.html') });
});

clearBtn.addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    status.textContent = 'Data cleared';
    viewBtn.disabled = true;
    progress.textContent = '';
  });
});
