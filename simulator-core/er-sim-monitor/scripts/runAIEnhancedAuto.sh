#!/bin/bash

# Auto-run AI-Enhanced system with all prompts answered
# Mode: 1 (hybrid)
# Apply renames: yes

cd "$(dirname "$0")/.."

# Send mode selection (1 for hybrid) and confirmation (yes) to stdin
printf "1\nyes\n" | node scripts/aiEnhancedRenaming.cjs
