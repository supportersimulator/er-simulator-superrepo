# VS Code Setup Guide for ER Sim Monitor

## Quick Start: Installing Extensions

### Method 1: Automatic Install (Recommended)
```bash
cd /Users/aarontjomsland/er-sim-monitor
./scripts/install-vscode-extensions.sh
```

### Method 2: Manual Install
1. Open VS Code
2. Press `Cmd + Shift + P`
3. Type: `Extensions: Show Recommended Extensions`
4. Click "Install All Workspace Recommendations"

---

## Claude Code (Atlas) Configuration

### ✅ Already Configured

Your workspace is now set up to:
- **Use Terminal Mode** (more stable than webview)
- **Auto-start Claude Code** when opening this workspace
- **Panel on right side** for better visibility

**Settings Applied** (`.vscode/settings.json`):
```json
{
  "claude.mode": "terminal",
  "claude.startOnOpen": true,
  "workbench.panel.defaultLocation": "right"
}
```

### Opening Claude Code Manually

If Claude Code doesn't auto-open, use any of these methods:

**Method 1: Command Palette**
```
Cmd + Shift + P
→ Type: "Claude Code: Focus"
→ Press Enter
```

**Method 2: Status Bar**
- Click the Claude icon in the bottom status bar

**Method 3: Activity Bar**
- Click the Claude icon in the left sidebar (if visible)

### Switching Between Modes

**Current Mode: Terminal** (Stable)
```
Cmd + Shift + P
→ Claude Code: Use Terminal
```

**If You Want to Try Webview** (Experimental):
```
Cmd + Shift + P
→ Claude Code: Use Webview
```

**Recommended**: Stick with Terminal mode for stability.

---

## Recommended Keyboard Shortcuts

### Set Up Quick Access to Claude Code

1. Open Keyboard Shortcuts: `Cmd + K, Cmd + S`
2. Search for: `Claude Code: Focus`
3. Click the `+` icon
4. Press your desired shortcut (e.g., `Cmd + Shift + A`)
5. Press Enter to save

**Suggested Shortcuts**:
- `Cmd + Shift + A` - Focus Claude Code (Atlas)
- `Cmd + Shift + E` - Focus Explorer
- `Cmd + Shift + G` - Focus Git

---

## Installed Extensions

### Original Extensions
- ✅ **Expo Tools** (`expo.vscode-expo-tools`) - React Native/Expo development
- ✅ **DSCode GPT** (`danielsanmedium.dscodegpt`) - AI coding assistant

### Code Quality & Formatting
- ✅ **ESLint** (`dbaeumer.vscode-eslint`) - JavaScript linting
- ✅ **Prettier** (`esbenp.prettier-vscode`) - Code formatting

### JavaScript/TypeScript Support
- ✅ **TypeScript** (`ms-vscode.vscode-typescript-next`) - Enhanced TS support
- ✅ **NPM IntelliSense** (`christian-kohler.npm-intellisense`) - Package autocomplete
- ✅ **Import Cost** (`wix.vscode-import-cost`) - Show import sizes

### Developer Experience
- ✅ **Error Lens** (`usernamehw.errorlens`) - Inline error messages
- ✅ **GitLens** (`eamodio.gitlens`) - Advanced Git features
- ✅ **Path IntelliSense** (`christian-kohler.path-intellisense`) - File path autocomplete
- ✅ **Code Spell Checker** (`streetsidesoftware.code-spell-checker`) - Spell checking

### React Native Specific
- ✅ **React Native Tools** (`msjsdiag.vscode-react-native`) - RN debugging & IntelliSense

### API Testing
- ✅ **Thunder Client** (`rangav.vscode-thunder-client`) - API testing & debugging

### Visual Enhancements
- ✅ **Rainbow Brackets** (`2gua.rainbow-brackets`) - Colorful bracket matching
- ✅ **Indent Rainbow** (`oderwat.indent-rainbow`) - Colorful indentation guides

---

## Workspace-Specific Settings

Your workspace has these optimizations:

### Code Actions
```json
"editor.codeActionsOnSave": {
  "source.fixAll": "explicit",
  "source.organizeImports": "explicit",
  "source.sortMembers": "explicit"
}
```

**What this does**:
- Auto-fixes ESLint errors on save
- Organizes imports alphabetically
- Sorts class members

### Panel Layout
```json
"workbench.panel.defaultLocation": "right"
```
- Keeps Claude Code panel on the right for more vertical space

---

## Troubleshooting

### Claude Code Not Auto-Opening?

**Check Extension Status**:
```
Cmd + Shift + P
→ Extensions: Show Installed Extensions
→ Search for "Claude Code"
→ Ensure it's enabled
```

**Manually Start**:
```
Cmd + Shift + P
→ Claude Code: Focus
```

### Extensions Not Installing?

**Check VS Code CLI**:
```bash
code --version
```

If command not found:
1. Open VS Code
2. Press `Cmd + Shift + P`
3. Type: `Shell Command: Install 'code' command in PATH`
4. Press Enter
5. Restart terminal
6. Run install script again

### Claude Code Webview Issues?

**Switch to Terminal Mode**:
```
Cmd + Shift + P
→ Claude Code: Use Terminal
```

See [CLAUDE_CODE_WEBVIEW_FIX.md](./CLAUDE_CODE_WEBVIEW_FIX.md) for details.

---

## Reinstalling Everything

### Complete Fresh Start

**1. Reinstall VS Code Extensions**:
```bash
./scripts/install-vscode-extensions.sh
```

**2. Restart VS Code**:
```bash
# Close VS Code completely
# Then reopen from terminal:
cd /Users/aarontjomsland/er-sim-monitor
code .
```

**3. Verify Claude Code**:
- Should auto-open in Terminal mode
- Check bottom status bar for Claude icon
- If not, run: `Claude Code: Focus`

---

## Next Steps After Fresh Install

1. ✅ Run extension install script
2. ✅ Restart VS Code
3. ✅ Verify Claude Code opens automatically
4. ✅ Set up keyboard shortcuts (optional)
5. ✅ Configure extension preferences (optional)

---

## Useful VS Code Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| Command Palette | `Cmd + Shift + P` | Access all commands |
| Quick Open | `Cmd + P` | Quickly open files |
| Settings | `Cmd + ,` | Open settings |
| Extensions | `Cmd + Shift + X` | Browse extensions |
| Keyboard Shortcuts | `Cmd + K, Cmd + S` | Edit shortcuts |
| Toggle Terminal | `Ctrl + \`` | Show/hide terminal |
| Split Editor | `Cmd + \` | Split editor pane |

---

## Related Documentation

- [Claude Code Webview Fix](./CLAUDE_CODE_WEBVIEW_FIX.md)
- [Extensions List](.vscode/extensions.json)
- [Workspace Settings](.vscode/settings.json)

---

**Last Updated**: November 9, 2025
**Maintained by**: Atlas (Claude Code)
