#!/usr/bin/env node

/**
 * Progress Monitoring System
 *
 * Monitors long-running operations with real-time progress display:
 * - Shows all active background processes
 * - Displays progress bars
 * - Estimates time remaining
 * - Allows process inspection
 * - Clean terminal output with live updates
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

const PROGRESS_DIR = path.join(__dirname, '..', '.progress');
const REFRESH_INTERVAL = 2000; // 2 seconds

function ensureProgressDir() {
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  }
}

function getActiveProcesses() {
  return new Promise((resolve) => {
    exec('ps aux | grep "node scripts/"', (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      const processes = [];
      const lines = stdout.split('\n');

      lines.forEach(line => {
        if (line.includes('node scripts/') && !line.includes('grep') && !line.includes('progressMonitor')) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[1];
          const cpu = parts[2];
          const mem = parts[3];
          const time = parts[9];
          const command = parts.slice(10).join(' ');

          // Extract script name
          const scriptMatch = command.match(/node scripts\/([^.\s]+)/);
          const scriptName = scriptMatch ? scriptMatch[1] : 'unknown';

          processes.push({
            pid,
            cpu,
            mem,
            time,
            script: scriptName,
            command
          });
        }
      });

      resolve(processes);
    });
  });
}

function getProgressFile(scriptName) {
  return path.join(PROGRESS_DIR, `${scriptName}.json`);
}

function readProgress(scriptName) {
  const progressFile = getProgressFile(scriptName);
  if (!fs.existsSync(progressFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(progressFile, 'utf8'));
  } catch (error) {
    return null;
  }
}

function formatTime(seconds) {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs.toFixed(0)}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function createProgressBar(percent, width = 40) {
  const filled = Math.floor(width * percent / 100);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent.toFixed(1)}%`;
}

function clearScreen() {
  process.stdout.write('\x1Bc'); // Clear entire screen
}

async function displayMonitor() {
  clearScreen();

  console.log('═══════════════════════════════════════════════════');
  console.log('  🔄 PROGRESS MONITOR - Real-Time Process Tracking');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const processes = await getActiveProcesses();

  if (processes.length === 0) {
    console.log('ℹ️  No active processes detected');
    console.log('');
    console.log('💡 Long-running scripts to monitor:');
    console.log('   • generateOverviewsStandalone');
    console.log('   • aiEnhancedRenaming');
    console.log('   • processBatchWithOpenAI');
    console.log('');
    return false; // No active processes
  }

  console.log(`Active Processes: ${processes.length}`);
  console.log('');

  processes.forEach((proc, idx) => {
    console.log(`${idx + 1}. ${proc.script}`);
    console.log(`   PID: ${proc.pid} | CPU: ${proc.cpu}% | Memory: ${proc.mem}% | Time: ${proc.time}`);

    // Try to read progress file
    const progress = readProgress(proc.script);
    if (progress) {
      const percent = (progress.current / progress.total * 100);
      const progressBar = createProgressBar(percent);

      console.log(`   ${progressBar}`);
      console.log(`   Status: ${progress.status || 'Running'}`);
      console.log(`   Items: ${progress.current}/${progress.total}`);

      if (progress.eta) {
        console.log(`   ETA: ${formatTime(progress.eta)}`);
      }

      if (progress.message) {
        console.log(`   📝 ${progress.message}`);
      }
    } else {
      console.log(`   ⚙️  Running (no progress data available)`);
    }

    console.log('');
  });

  console.log('─'.repeat(55));
  console.log('Press Ctrl+C to exit monitor | Refreshing every 2s');
  console.log('');

  return true; // Has active processes
}

async function monitorLoop() {
  ensureProgressDir();

  let hasProcesses = await displayMonitor();

  const interval = setInterval(async () => {
    hasProcesses = await displayMonitor();

    if (!hasProcesses) {
      console.log('✅ All processes completed');
      console.log('');
      clearInterval(interval);
      process.exit(0);
    }
  }, REFRESH_INTERVAL);

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('');
    console.log('');
    console.log('✅ Monitor stopped');
    console.log('');
    process.exit(0);
  });
}

// Helper functions for scripts to report progress
function updateProgress(scriptName, current, total, status = '', message = '') {
  ensureProgressDir();

  const elapsed = Date.now() - (global.startTime || Date.now());
  const rate = current / (elapsed / 1000); // items per second
  const remaining = total - current;
  const eta = remaining / rate;

  const progress = {
    scriptName,
    current,
    total,
    percent: (current / total * 100).toFixed(1),
    status,
    message,
    eta,
    timestamp: new Date().toISOString()
  };

  const progressFile = getProgressFile(scriptName);
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

function startProgress(scriptName, total, status = 'Initializing') {
  global.startTime = Date.now();
  updateProgress(scriptName, 0, total, status, 'Starting...');
}

function completeProgress(scriptName) {
  const progressFile = getProgressFile(scriptName);
  if (fs.existsSync(progressFile)) {
    fs.unlinkSync(progressFile);
  }
}

if (require.main === module) {
  console.log('');
  console.log('Starting progress monitor...');
  console.log('Monitoring all active node processes');
  console.log('');

  setTimeout(() => {
    monitorLoop().catch(err => {
      console.error('❌ Monitor error:', err.message);
      process.exit(1);
    });
  }, 1000);
}

module.exports = {
  updateProgress,
  startProgress,
  completeProgress,
  getActiveProcesses,
  readProgress
};
