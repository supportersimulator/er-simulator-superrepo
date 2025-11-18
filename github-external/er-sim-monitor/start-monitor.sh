#!/bin/bash
# ER Simulator Monitor - Clean Startup Script
# Usage: ./start-monitor.sh

echo "🧹 Cleaning up old processes..."
killall -9 node 2>/dev/null
killall -9 Simulator 2>/dev/null
pkill -9 -f "expo|metro" 2>/dev/null

echo "🗑️  Clearing caches..."
rm -rf .expo node_modules/.cache 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null

echo "📱 Opening iOS Simulator..."
open -a Simulator

echo "⏳ Waiting for simulator to boot..."
sleep 5

echo "🚀 Starting Expo with fresh cache..."
npx expo start --clear --ios

echo "✅ Monitor should be loading on simulator!"
