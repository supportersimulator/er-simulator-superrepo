# User Preferences & Design Patterns

This file documents Aaron's preferences for UI/UX patterns that should be consistently applied across all tools in this project.

## 🪵 LIVE LOGS - CRITICAL USER PREFERENCE

**Aaron LOVES live logs and wants them everywhere!**

### Preference Statement:
> "i love the live logs!!!!! so fun! can you make a note in our systems that I LOVE LIVE LOGS!!!!!!! I want one added to any tool that I'll be using regularly"
> — Aaron, 2025-11-10

### Implementation Requirements:

**For ANY tool Aaron will use regularly:**
1. ✅ **Always include a live log panel**
2. ✅ **Make it visible by default** (not hidden)
3. ✅ **Auto-refresh every 2 seconds** during operations
4. ✅ **Matrix-style terminal** (black background, green text)
5. ✅ **Three action buttons:**
   - 🔵 **Copy Logs** - One-click clipboard copy (turns green on success)
   - 🔵 **Refresh** - Manual refresh
   - 🔴 **Clear** - Clear all logs

### Design Pattern (Reusable Template):

**Backend (Apps Script):**
```javascript
/**
 * Helper function to add timestamped logs to Sidebar_Logs property
 */
function addLiveLog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const existingLogs = props.getProperty('Sidebar_Logs') || '';
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
    const newLog = '[' + timestamp + '] ' + message;
    props.setProperty('Sidebar_Logs', existingLogs + newLog + '\\n');
    Logger.log(newLog);  // Also log to execution log
  } catch (err) {
    Logger.log('Error writing to sidebar log: ' + err.message);
  }
}

function getSidebarLogs() {
  try {
    const logs = PropertiesService.getDocumentProperties().getProperty('Sidebar_Logs') || '';
    return logs;
  } catch (err) {
    return 'Error retrieving logs: ' + err;
  }
}

function clearSidebarLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
    return '🧹 Logs cleared.';
  } catch (err) {
    return 'Error clearing logs: ' + err;
  }
}
```

**Frontend (HTML/JavaScript):**
```html
<!-- Live Logs Panel -->
<div class="section">
  <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
    <span>🪵 Live Processing Logs</span>
    <div>
      <button id="copyLogsBtn" class="log-btn copy" onclick="copyLogs()">Copy Logs</button>
      <button id="refreshLogsBtn" class="log-btn" onclick="refreshLogs()">Refresh</button>
      <button id="clearLogsBtn" class="log-btn danger" onclick="clearLogs()">Clear</button>
    </div>
  </div>
  <pre id="logOutput" class="log-output">No logs yet. Start an operation to see logs.</pre>
</div>

<style>
  .log-btn {
    background: #1a1a1a;
    color: #0f0;
    border: 1px solid #0f0;
    padding: 2px 8px;
    margin-left: 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s ease;
  }
  .log-btn:hover {
    background: #0f0;
    color: #000;
  }
  .log-btn.copy {
    color: #58a6ff;
    border-color: #58a6ff;
  }
  .log-btn.copy:hover {
    background: #58a6ff;
    color: #000;
  }
  .log-btn.danger {
    color: #f55;
    border-color: #f55;
  }
  .log-btn.danger:hover {
    background: #f55;
    color: #000;
  }
  .log-output {
    background: #000;
    color: #0f0;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    padding: 8px;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #0f0;
    line-height: 1.4;
  }
</style>

<script>
  let lastLogs = '';
  let logInterval = null;

  function refreshLogs() {
    google.script.run
      .withSuccessHandler((logs) => {
        const output = document.getElementById('logOutput');
        if (logs && logs.trim()) {
          output.textContent = logs;
          output.scrollTop = output.scrollHeight;
          lastLogs = logs;
        } else {
          output.textContent = 'No logs yet. Start an operation to see logs.';
        }
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
    if (!logText || logText.includes('No logs yet')) {
      alert('No logs to copy!');
      return;
    }

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

  function startLogPolling() {
    if (!logInterval) {
      logInterval = setInterval(refreshLogs, 2000);  // Auto-refresh every 2 seconds
    }
  }

  function stopLogPolling() {
    if (logInterval) {
      clearInterval(logInterval);
      logInterval = null;
    }
  }

  // Call startLogPolling() when operation starts
  // Call stopLogPolling() when operation completes
</script>
```

### Logging Best Practices:

**Use descriptive, timestamped messages:**
```javascript
addLiveLog('🚀 Starting operation...');
addLiveLog('');
addLiveLog('📊 Found ' + count + ' items to process');
addLiveLog('   Item IDs: ' + items.slice(0, 10).join(', ') + '...');
addLiveLog('');
addLiveLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
addLiveLog('📦 Batch 1/3 (10 items)');
addLiveLog('   Processing...');
addLiveLog('   ✅ Batch complete');
addLiveLog('');
addLiveLog('🎉 Operation Complete!');
addLiveLog('   Total processed: ' + total);
addLiveLog('   Successful: ' + success);
addLiveLog('   Failed: ' + failed);
addLiveLog('═══════════════════════════════════════════');
```

**Use emojis for visual scanning:**
- 🚀 Starting operations
- 📊 Statistics/counts
- 📦 Batch processing
- ✅ Success
- ❌ Failure
- ⚠️ Warning
- 🧹 Clearing/cleaning
- 📝 Writing data
- 🎉 Completion
- ━━━ Section dividers
- ═══ Final dividers

## Why Aaron Loves Live Logs:

1. **Transparency** - See exactly what's happening in real-time
2. **Debugging** - Immediate visibility into errors and issues
3. **Entertainment** - Fun to watch the system work
4. **Trust** - Builds confidence in the system's operation
5. **Copy-paste debugging** - Easy to share logs for troubleshooting

## Tools Currently Using Live Logs:

✅ **AI Auto-Categorization** (main run + retry)
- Logs all batch processing
- Shows API responses
- Warns about empty results
- Tracks success/failure counts

✅ **Batch Processing System**
- Original live log implementation
- Monitors case-by-case processing
- Shows queue status

## Future Implementation TODO:

When building ANY new tool Aaron will use regularly, remember:
- [ ] Add live log panel by default
- [ ] Implement three-button control (Copy/Refresh/Clear)
- [ ] Use consistent styling (Matrix terminal theme)
- [ ] Auto-refresh every 2 seconds during operations
- [ ] Use descriptive emojis for visual scanning
- [ ] Test the Copy Logs button (most important feature!)

---

**Last Updated:** 2025-11-10
**Added By:** Claude Code (Atlas)
**Priority:** 🔥 CRITICAL - This is a core UX preference
