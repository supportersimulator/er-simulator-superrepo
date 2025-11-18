# VS Code Keybindings for Atlas (Claude Code)

## Quick Setup: Cmd + Shift + A to Open Atlas

### Method 1: GUI Setup (Recommended)

1. Press: `Cmd + K`, then `Cmd + S`
2. Search for: `Claude Code: Focus`
3. Click the `+` icon next to the command
4. Press: `Cmd + Shift + A`
5. Press `Enter` to save

**Done!** Now `Cmd + Shift + A` opens Atlas instantly.

---

### Method 2: Manual JSON Edit (Advanced)

If you prefer editing the keybindings file directly:

1. **Open Keybindings JSON**:
   - Press: `Cmd + Shift + P`
   - Type: `Preferences: Open Keyboard Shortcuts (JSON)`
   - Press Enter

2. **Add this snippet**:
```json
[
  {
    "key": "cmd+shift+a",
    "command": "claude.focus",
    "when": "!inChat"
  },
  {
    "key": "cmd+shift+a",
    "command": "workbench.action.chat.open",
    "when": "inChat"
  }
]
```

3. **Save the file** (`Cmd + S`)

---

## Recommended Additional Keybindings

### Quick Access Shortcuts

Add these to your keybindings for faster workflow:

```json
[
  // Atlas (Claude Code) - Quick access
  {
    "key": "cmd+shift+a",
    "command": "claude.focus"
  },

  // New Claude Code conversation
  {
    "key": "cmd+shift+n",
    "command": "claude.newConversation"
  },

  // Toggle Atlas panel visibility
  {
    "key": "cmd+shift+c",
    "command": "claude.togglePanel"
  },

  // Focus terminal
  {
    "key": "ctrl+`",
    "command": "workbench.action.terminal.focus"
  },

  // Focus editor from terminal
  {
    "key": "ctrl+`",
    "command": "workbench.action.focusActiveEditorGroup",
    "when": "terminalFocus"
  }
]
```

---

## Common Keybinding Commands for Claude Code

| Command | Suggested Shortcut | Description |
|---------|-------------------|-------------|
| `claude.focus` | `Cmd + Shift + A` | Open/focus Atlas |
| `claude.newConversation` | `Cmd + Shift + N` | Start new conversation |
| `claude.togglePanel` | `Cmd + Shift + C` | Show/hide Claude panel |
| `claude.clearConversation` | `Cmd + Shift + K` | Clear current chat |
| `claude.stopGeneration` | `Escape` | Stop Atlas response |

---

## Verifying Your Setup

**Test the keybinding**:
1. Close all panels
2. Press `Cmd + Shift + A`
3. Atlas should appear instantly

**If it doesn't work**:
- Check for keybinding conflicts
- Open Keyboard Shortcuts (`Cmd + K, Cmd + S`)
- Search for `cmd+shift+a` to see what else uses it
- Remove conflicts or choose different shortcut

---

## Keybinding Conflicts to Watch For

`Cmd + Shift + A` might conflict with:
- Some extensions' "Add to..." commands
- Custom user keybindings
- OS-level shortcuts

**Solution**:
1. Check for conflicts in Keyboard Shortcuts editor
2. If conflict exists, either:
   - Remove the conflicting keybinding, OR
   - Choose alternative like `Cmd + Shift + L` (for "Atlas")

---

## Full Recommended Keybinding Set

Copy this complete set for optimal Atlas workflow:

```json
[
  // === ATLAS (CLAUDE CODE) SHORTCUTS ===

  // Quick access to Atlas
  {
    "key": "cmd+shift+a",
    "command": "claude.focus",
    "when": "!inChat"
  },

  // New conversation with Atlas
  {
    "key": "cmd+shift+n",
    "command": "claude.newConversation"
  },

  // Clear current conversation
  {
    "key": "cmd+shift+k",
    "command": "claude.clearConversation"
  },

  // Stop Atlas from responding
  {
    "key": "escape",
    "command": "claude.stopGeneration",
    "when": "claude.generating"
  },

  // Toggle Atlas panel
  {
    "key": "cmd+shift+c",
    "command": "claude.togglePanel"
  },

  // === WORKFLOW SHORTCUTS ===

  // Quick file search
  {
    "key": "cmd+p",
    "command": "workbench.action.quickOpen"
  },

  // Command palette
  {
    "key": "cmd+shift+p",
    "command": "workbench.action.showCommands"
  },

  // Toggle terminal
  {
    "key": "ctrl+`",
    "command": "workbench.action.terminal.toggleTerminal"
  },

  // Focus editor
  {
    "key": "cmd+1",
    "command": "workbench.action.focusFirstEditorGroup"
  },

  // Focus Atlas panel
  {
    "key": "cmd+2",
    "command": "workbench.action.focusSecondEditorGroup"
  }
]
```

---

## Troubleshooting

### Keybinding Not Working?

**Check 1: Extension Enabled**
```
Cmd + Shift + P
→ Extensions: Show Installed Extensions
→ Search: "Claude Code"
→ Ensure enabled
```

**Check 2: Command Available**
```
Cmd + Shift + P
→ Type: "Claude Code: Focus"
→ Should appear in list
```

**Check 3: Conflicts**
```
Cmd + K, Cmd + S
→ Search: "cmd+shift+a"
→ See if multiple commands use it
```

### Alternative Shortcuts

If `Cmd + Shift + A` conflicts with something important:

**Option 1**: `Cmd + Shift + L` (for "Atlas")
**Option 2**: `Cmd + Option + A`
**Option 3**: `Ctrl + Shift + A`

---

## Quick Reference Card

Print or save this reference:

```
╔═══════════════════════════════════════════╗
║     ATLAS (CLAUDE CODE) SHORTCUTS         ║
╠═══════════════════════════════════════════╣
║  Cmd + Shift + A  │ Open/Focus Atlas      ║
║  Cmd + Shift + N  │ New Conversation      ║
║  Cmd + Shift + C  │ Toggle Panel          ║
║  Cmd + Shift + K  │ Clear Conversation    ║
║  Escape           │ Stop Generation       ║
╠═══════════════════════════════════════════╣
║         GENERAL SHORTCUTS                 ║
╠═══════════════════════════════════════════╣
║  Cmd + P          │ Quick File Open       ║
║  Cmd + Shift + P  │ Command Palette       ║
║  Ctrl + `         │ Toggle Terminal       ║
║  Cmd + 1          │ Focus Editor          ║
║  Cmd + 2          │ Focus Side Panel      ║
╚═══════════════════════════════════════════╝
```

---

**Last Updated**: November 9, 2025
**Related**: [VSCODE_SETUP_GUIDE.md](./VSCODE_SETUP_GUIDE.md)
