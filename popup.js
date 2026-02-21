const scanBtn = document.getElementById('scan');
const viewBtn = document.getElementById('view');
const clearBtn = document.getElementById('clear');
const status = document.getElementById('status');
const progress = document.getElementById('progress');

// check for existing data
chrome.storage.local.get(['connections', 'scanProgress'], (result) => {
  if (result.connections && Object.keys(result.connections).length > 0) {
    const count = Object.keys(result.connections).length;
    status.textContent = `${count} friends scanned`;
    viewBtn.disabled = false;
  }

  if (result.scanProgress) {
    const { current, total } = result.scanProgress;
    progress.textContent = `Scanning: ${current}/${total}`;
    scanBtn.disabled = true;
    startProgressPolling();
  }
});

let progressInterval = null;

function startProgressPolling() {
  progressInterval = setInterval(() => {
    chrome.storage.local.get(['scanProgress', 'connections'], (result) => {
      if (result.scanProgress) {
        const { current, total } = result.scanProgress;
        progress.textContent = `Scanning: ${current}/${total}`;
      } else {
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

scanBtn.addEventListener('click', () => {
  scanBtn.disabled = true;
  status.textContent = 'Starting scan...';
  progress.textContent = 'Scanning: 0/?';
  startProgressPolling();

  // send to background worker instead of content script
  chrome.runtime.sendMessage({ action: 'scan' }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Error: Refresh Discord and try again';
      scanBtn.disabled = false;
      clearInterval(progressInterval);
      progress.textContent = '';
      return;
    }

    if (response?.error) {
      status.textContent = `Error: ${response.error}`;
      scanBtn.disabled = false;
      clearInterval(progressInterval);
      progress.textContent = '';
    }
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
