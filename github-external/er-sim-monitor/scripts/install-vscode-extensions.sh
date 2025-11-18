#!/bin/bash

# VS Code Extensions Auto-Install Script
# Run this after reinstalling VS Code to restore all recommended extensions

echo "🔧 Installing VS Code Extensions for ER Sim Monitor Project..."
echo ""

# Array of extension IDs
extensions=(
  # Original extensions
  "expo.vscode-expo-tools"
  "danielsanmedium.dscodegpt"

  # Code Quality & Formatting
  "dbaeumer.vscode-eslint"
  "esbenp.prettier-vscode"

  # JavaScript/TypeScript Enhanced Support
  "ms-vscode.vscode-typescript-next"
  "christian-kohler.npm-intellisense"
  "wix.vscode-import-cost"

  # Developer Experience
  "usernamehw.errorlens"
  "eamodio.gitlens"
  "christian-kohler.path-intellisense"
  "streetsidesoftware.code-spell-checker"

  # React Native Specific
  "msjsdiag.vscode-react-native"

  # API Testing & Development
  "rangav.vscode-thunder-client"

  # Visual Enhancements
  "2gua.rainbow-brackets"
  "oderwat.indent-rainbow"
)

# Counter for installed extensions
installed=0
total=${#extensions[@]}

# Install each extension
for ext in "${extensions[@]}"; do
  echo "📦 Installing: $ext"
  code --install-extension "$ext" --force

  if [ $? -eq 0 ]; then
    ((installed++))
    echo "   ✅ Success"
  else
    echo "   ❌ Failed to install $ext"
  fi
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Installation Complete!"
echo "📊 Installed: $installed / $total extensions"
echo ""
echo "💡 Next steps:"
echo "   1. Restart VS Code to activate all extensions"
echo "   2. Configure any extension-specific settings"
echo "   3. Run 'code .' from project directory to open workspace"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
