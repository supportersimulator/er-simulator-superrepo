/**
 * Logging Utilities Module
 *
 * Isolated single-purpose module containing 11 functions
 * Generated: 2025-11-04T18:30:22.775Z
 * Source: Utilities.gs (refined from monolithic code)
 */

function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

function copyLogs() {
        const logText = document.getElementById('logOutput').textContent;
        if (!logText || logText === 'No logs yet.') {
          alert('No logs to copy!');
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
          const btn = document.getElementById('copyLogsBtn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.color = '#0f0';
          btn.style.borderColor = '#0f0';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '#58a6ff';
            btn.style.borderColor = '#58a6ff';
          }, 2000);
        }).catch(err => {
          alert('Failed to copy logs: ' + err);
        });
      }

function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }

function refreshLogs() {
        google.script.run
          .withSuccessHandler((logs) => {
            const output = document.getElementById('logOutput');
            if (logs && logs !== lastLogs) {
              const diff = logs.replace(lastLogs, '').trim();
              if (diff) {
                const newLine = document.createElement('div');
                newLine.textContent = diff;
                newLine.classList.add('new-log-line');
                output.appendChild(newLine);
              } else {
                output.textContent = logs;
              }
              output.scrollTop = output.scrollHeight;
              lastLogs = logs;
            }
            if (!logs) output.textContent = 'No logs yet.';
          })
          .getSidebarLogs();
      }

function clearLogs() {
        google.script.run
          .withSuccessHandler((msg) => {
            document.getElementById('logOutput').textContent = msg;
            lastLogs = '';
          })
          .clearSidebarLogs();
      }

function copyLogs() {
        const logText = document.getElementById('logOutput').textContent;
        if (!logText || logText === 'No logs yet.') {
          alert('No logs to copy!');
          return;
        }

        // Copy to clipboard
        navigator.clipboard.writeText(logText).then(() => {
          const btn = document.getElementById('copyLogsBtn');
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          btn.style.color = '#0f0';
          btn.style.borderColor = '#0f0';
          setTimeout(() => {
            btn.textContent = originalText;
            btn.style.color = '#58a6ff';
            btn.style.borderColor = '#58a6ff';
          }, 2000);
        }).catch(err => {
          alert('Failed to copy logs: ' + err);
        });
      }

function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }

function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

function logLong(label, text) {
  try {
    const chunkSize = 8000; // safe for Apps Script logs
    if (!text) {
      appendLogSafe(`(no text to log for ${label})`);
      return;
    }
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.substring(i, i + chunkSize);
      appendLogSafe(`${label} [${i / chunkSize + 1}]:\n${chunk}`);
    }
  } catch (err) {
    appendLogSafe(`logLong error: ${err}`);
  }
}

function logLong_(label, text) {
  const chunkSize = 9000; // avoid truncation in Apps Script logs
  for (let i = 0; i < text.length; i += chunkSize) {
    Logger.log(`${label} [${i / chunkSize + 1}]:\n` + text.slice(i, i + chunkSize));
  }
}