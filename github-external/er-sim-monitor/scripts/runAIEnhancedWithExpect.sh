#!/usr/bin/expect -f

# Auto-run AI-Enhanced system using expect to handle prompts

set timeout -1

cd [file dirname $argv0]/..

spawn node scripts/aiEnhancedRenaming.cjs

# Wait for mode selection prompt
expect "Mode*"
send "1\r"

# Wait for apply renames prompt
expect "Apply these AI-enhanced renames?*"
send "yes\r"

# Wait for completion
expect eof
