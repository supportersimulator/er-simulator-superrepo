# Claude Code Webview Failure & Terminal Mode Fix

**Date**: November 9, 2025
**Status**: ✅ RESOLVED
**Solution**: Use Terminal Mode

---

## 🔴 Symptom

The Claude Code extension in VS Code stopped working with the following symptoms:

- Webview interface wouldn't load
- VS Code logs showed repeated `Blocked vscode-webview request` errors
- Extension host terminated unexpectedly with crash messages
- Claude icon appeared in sidebar but didn't respond to clicks
- No chat interface would initialize

---

## 🔍 Root Cause Analysis

### Technical Breakdown

**Failure Chain**:
```
Corrupted Webview Cache
    ↓
Electron Sandbox Permission Breakdown
    ↓
MCP Server Bridge Communication Failure
    ↓
VS Code blocks vscode-webview requests
    ↓
Extension Host Termination
```

**What Was Happening**:

1. **Webview Mode Architecture**:
   - VS Code Extension → Electron Webview → MCP Server (localhost:20384) → Claude Binary
   - Requires intact webview cache and sandbox permissions

2. **The Break**:
   - Webview cache became corrupted over time
   - Electron sandbox lost proper permissions
   - MCP server bridge couldn't establish connection
   - VS Code security model blocked all webview requests
   - Without the bridge, extension couldn't initialize chat interface
   - Extension host crashed during startup handshake

3. **Why Standard Fixes Didn't Work**:
   - Uninstalling/reinstalling extension → Cache remained
   - Clearing `globalStorage` → Sandbox permissions still broken
   - Deleting lock files → MCP bridge still couldn't connect
   - The Electron layer itself was corrupted

---

## ❌ Failed Troubleshooting Attempts

### What We Tried (That Didn't Work)

1. **Uninstall/Reinstall Extension**
   ```bash
   # Removed extension completely
   # Reinstalled v2.0.35 from marketplace
   # Result: Same error
   ```

2. **Clear Extension Storage**
   ```bash
   rm -rf ~/Library/Application\ Support/Code/User/globalStorage/anthropic.claude-code
   # Result: Webview still blocked
   ```

3. **Delete MCP Lock Files**
   ```bash
   find ~/Library/Application\ Support/Code -name "*.lock" -delete
   # Result: No improvement
   ```

4. **Clear All VS Code Caches**
   ```bash
   rm -rf ~/Library/Application\ Support/Code/Cache
   rm -rf ~/Library/Application\ Support/Code/CachedData
   # Result: Webview still failed to load
   ```

All of these attempted to fix the webview layer, but the fundamental Electron sandbox corruption persisted.

---

## ✅ Solution That Worked

### **Switched to Terminal Mode**

**Command Run**:
```
Claude Code: Use Terminal
```

**How to Execute**:
1. Open VS Code Command Palette (Cmd+Shift+P)
2. Type: `Claude Code: Use Terminal`
3. Press Enter
4. Extension immediately started working

---

## 🧠 Why Terminal Mode Worked

### Architecture Comparison

**Webview Mode (Broken)**:
```
VS Code Extension
    ↓
Electron Webview (corrupted)
    ↓
MCP Server Bridge (blocked)
    ↓
Claude Binary
```

**Terminal Mode (Working)**:
```
VS Code Extension
    ↓
Shell Process (direct)
    ↓
Claude Binary
```

### Key Differences

| Aspect | Webview Mode | Terminal Mode |
|--------|-------------|---------------|
| **UI Layer** | Electron Webview | Terminal/Shell I/O |
| **Communication** | MCP Server Bridge | Direct CLI |
| **Dependencies** | Sandbox permissions | Shell environment |
| **Failure Point** | Webview cache/sandbox | None (more stable) |
| **Environment** | Isolated | Uses `.zshrc` variables |

**Why It's More Stable**:
- ✅ No webview sandbox needed
- ✅ No MCP bridge dependency
- ✅ Direct shell I/O communication
- ✅ Leverages existing environment variables (`OPENAI_API_KEY`, `PATH`, etc.)
- ✅ Simpler architecture = fewer failure points

---

## 🔄 Can Both Modes Coexist?

**Yes, with caveats:**

### ✅ Coexistence Rules

- Both modes use **different communication pathways**
- No file conflicts between modes
- Safe to switch back and forth

### ⚠️ Limitations

- Can only use **ONE mode at a time** (per VS Code window)
- Switching requires running command again
- If webview corrupts again, must repeat cache clearing steps

### 🎯 Recommended Strategy

**Primary Workflow** (Most Stable):
```bash
# Use Terminal mode as default
Claude Code: Use Terminal
```

**If You Want to Try Webview Again**:
```bash
# 1. Clear caches first
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/anthropic.claude-code/webview-cache
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*/anthropic.claude-code

# 2. Switch to webview
# Run: Claude Code: Use Webview

# 3. If it breaks again, immediately fall back
# Run: Claude Code: Use Terminal
```

---

## 🛡️ Prevention Strategy

### Best Practices

1. **Use Terminal Mode as Primary**
   - More stable, fewer dependencies
   - Direct communication pathway
   - Leverages existing shell environment

2. **Keep Webview as Secondary**
   - Only use if you prefer the visual chat interface
   - Be prepared to fall back to Terminal mode

3. **If Webview Breaks Again**
   - Don't waste time troubleshooting
   - Immediately switch to Terminal mode
   - Document any new symptoms

4. **Regular Maintenance**
   - Periodically clear VS Code caches
   - Keep extension updated
   - Monitor for Electron sandbox issues

---

## 📋 Quick Reference

### Immediate Fix Command
```
Claude Code: Use Terminal
```

### Webview Cache Clear (If Trying Webview Again)
```bash
rm -rf ~/Library/Application\ Support/Code/User/globalStorage/anthropic.claude-code/webview-cache
rm -rf ~/Library/Application\ Support/Code/User/workspaceStorage/*/anthropic.claude-code
```

### Check Current Mode
Look at bottom status bar in VS Code - Terminal mode will show shell-style interaction.

---

## 🔗 Related Documentation

- [VS Code Extensions Setup](./VSCODE_EXTENSIONS_SETUP.md)
- Claude Code Official Docs: https://docs.claude.com/claude-code
- MCP Protocol: https://modelcontextprotocol.io

---

## 📝 Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-11-09 | Initial documentation of webview failure & Terminal mode fix | Atlas |

---

**Status**: This fix is permanent as long as Terminal mode is used. Webview mode should be considered experimental/unstable for this installation.
