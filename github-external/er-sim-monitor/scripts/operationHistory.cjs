#!/usr/bin/env node

/**
 * Operation History & Granular Undo System
 *
 * Tracks all data-modifying operations with metadata for selective undo:
 * - Records operation type, timestamp, affected files
 * - Stores before/after snapshots
 * - Supports granular undo (undo specific operation)
 * - Maintains operation log for audit trail
 */

const fs = require('fs');
const path = require('path');

const HISTORY_DIR = path.join(__dirname, '..', 'operation-history');
const HISTORY_LOG = path.join(HISTORY_DIR, 'history.json');

const MAX_HISTORY_SIZE = 50; // Keep last 50 operations

function ensureHistoryDir() {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_LOG)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(HISTORY_LOG, 'utf8'));
  } catch (error) {
    console.error(`⚠️  Failed to load history: ${error.message}`);
    return [];
  }
}

function saveHistory(history) {
  ensureHistoryDir();
  fs.writeFileSync(HISTORY_LOG, JSON.stringify(history, null, 2));
}

function recordOperation(operationType, description, affectedFiles, beforeData, afterData) {
  const timestamp = new Date().toISOString();
  const operationId = `op-${Date.now()}`;

  const operation = {
    id: operationId,
    type: operationType,
    description,
    timestamp,
    affectedFiles,
    canUndo: true
  };

  // Save snapshots
  const snapshotDir = path.join(HISTORY_DIR, operationId);
  fs.mkdirSync(snapshotDir, { recursive: true });

  Object.entries(beforeData).forEach(([fileName, data]) => {
    const beforePath = path.join(snapshotDir, `${fileName}.before.json`);
    fs.writeFileSync(beforePath, JSON.stringify(data, null, 2));
  });

  Object.entries(afterData).forEach(([fileName, data]) => {
    const afterPath = path.join(snapshotDir, `${fileName}.after.json`);
    fs.writeFileSync(afterPath, JSON.stringify(data, null, 2));
  });

  // Update history log
  const history = loadHistory();
  history.unshift(operation); // Add to beginning

  // Trim history if too large
  if (history.length > MAX_HISTORY_SIZE) {
    const removed = history.splice(MAX_HISTORY_SIZE);
    // Clean up old snapshots
    removed.forEach(op => {
      const oldSnapshotDir = path.join(HISTORY_DIR, op.id);
      if (fs.existsSync(oldSnapshotDir)) {
        fs.rmSync(oldSnapshotDir, { recursive: true, force: true });
      }
    });
  }

  saveHistory(history);

  console.log(`📝 Operation recorded: ${operationId}`);
  console.log(`   Type: ${operationType}`);
  console.log(`   Description: ${description}`);
  console.log('');

  return operationId;
}

async function showHistory() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  📜 OPERATION HISTORY');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const history = loadHistory();

  if (history.length === 0) {
    console.log('ℹ️  No operations recorded yet');
    console.log('');
    return;
  }

  console.log(`Showing last ${Math.min(20, history.length)} operations:`);
  console.log('');

  history.slice(0, 20).forEach((op, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    const date = new Date(op.timestamp).toLocaleString();
    const status = op.canUndo ? '✓' : '✗';

    console.log(`${num}. [${status}] ${op.description}`);
    console.log(`    Type: ${op.type} | ID: ${op.id}`);
    console.log(`    Date: ${date}`);
    console.log(`    Files: ${op.affectedFiles.join(', ')}`);
    console.log('');
  });

  console.log('💡 Commands:');
  console.log('   npm run undo                 # Undo last operation');
  console.log('   npm run undo --operation=N   # Undo specific operation (1-based index)');
  console.log('');
}

async function undoOperation(operationIndex = 0) {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  ↩️  UNDO OPERATION');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const history = loadHistory();

  if (history.length === 0) {
    console.log('❌ No operations to undo');
    console.log('');
    return;
  }

  const operation = history[operationIndex];

  if (!operation) {
    console.log(`❌ Operation ${operationIndex + 1} not found in history`);
    console.log(`   Total operations: ${history.length}`);
    console.log('');
    return;
  }

  if (!operation.canUndo) {
    console.log(`❌ Operation cannot be undone: ${operation.description}`);
    console.log('');
    return;
  }

  console.log(`Undoing operation: ${operation.description}`);
  console.log(`   Type: ${operation.type}`);
  console.log(`   Date: ${new Date(operation.timestamp).toLocaleString()}`);
  console.log('');

  // Restore from before snapshots
  const snapshotDir = path.join(HISTORY_DIR, operation.id);

  if (!fs.existsSync(snapshotDir)) {
    console.log(`❌ Snapshot directory not found: ${snapshotDir}`);
    console.log('   Operation cannot be undone (data missing)');
    console.log('');
    return;
  }

  const files = fs.readdirSync(snapshotDir);
  const beforeFiles = files.filter(f => f.endsWith('.before.json'));

  console.log(`Restoring ${beforeFiles.length} files...`);
  console.log('');

  beforeFiles.forEach(file => {
    const fileName = file.replace('.before.json', '');
    const beforePath = path.join(snapshotDir, file);
    const targetPath = path.join(__dirname, '..', `${fileName}.json`);

    const beforeData = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
    fs.writeFileSync(targetPath, JSON.stringify(beforeData, null, 2));

    console.log(`   ✅ Restored ${fileName}.json`);
  });

  console.log('');
  console.log('✅ Undo complete!');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   • Run: npm run validate-system (verify integrity)');
  console.log('   • Run: npm run history (see updated history)');
  console.log('');

  // Mark as undone in history
  operation.canUndo = false;
  operation.undoneAt = new Date().toISOString();
  saveHistory(history);
}

// Parse command-line arguments
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
  if (command === 'show' || !command) {
    showHistory();
  } else if (command === 'undo') {
    let operationIndex = 0;
    const opArg = args.find(a => a.startsWith('--operation='));
    if (opArg) {
      operationIndex = parseInt(opArg.split('=')[1], 10) - 1; // Convert 1-based to 0-based
    }
    undoOperation(operationIndex).catch(err => {
      console.error('❌ Undo failed:', err.message);
      process.exit(1);
    });
  } else {
    console.log('');
    console.log('❌ Unknown command:', command);
    console.log('');
    console.log('Usage:');
    console.log('   npm run history                  # Show operation history');
    console.log('   npm run undo                     # Undo last operation');
    console.log('   npm run undo --operation=N       # Undo specific operation');
    console.log('');
    process.exit(1);
  }
}

module.exports = { recordOperation, showHistory, undoOperation };
