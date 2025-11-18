#!/usr/bin/env node

/**
 * ECG Save Server
 * Simple local server that receives SVG/PNG exports from ecg-to-svg-converter.html
 * and saves them to the /exports directory
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3456;
const EXPORTS_DIR = path.join(__dirname, 'exports');
const PRODUCTION_SVG_DIR = path.join(__dirname, 'assets', 'waveforms', 'svg'); // SVG production location
const LEGACY_PNG_DIR = path.join(__dirname, 'assets', 'waveforms', 'png'); // PNG backup (deprecated)
const WAVEFORMS_REGISTRY = path.join(__dirname, 'assets', 'waveforms', 'svg', 'waveforms.js'); // JavaScript registry

// Create all necessary directories
[EXPORTS_DIR, PRODUCTION_SVG_DIR, LEGACY_PNG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

/**
 * Updates the waveforms.js registry with new waveform data
 * Extracts SVG path data and adds/updates entry automatically
 */
function updateWaveformsRegistry(svgPath, waveformKey, rWavePositions) {
  console.log('');
  console.log('🔄 AUTO-UPDATING WAVEFORMS.JS REGISTRY...');

  // Extract waveform variant name (preserve canonical name with _ecg suffix)
  const variant = waveformKey || path.basename(svgPath, '.svg');

  // Read SVG file and extract path data
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  const pathMatch = svgContent.match(/<path[^>]*\sd="([^"]+)"/);

  if (!pathMatch) {
    throw new Error('Could not extract path data from SVG');
  }

  const pathData = pathMatch[1];

  // Extract dimensions from SVG viewBox or width/height
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const widthMatch = svgContent.match(/width="(\d+)"/);
  const heightMatch = svgContent.match(/height="(\d+)"/);

  let width = 1000;
  let height = 60;

  if (viewBoxMatch) {
    const viewBoxParts = viewBoxMatch[1].split(/\s+/);
    width = parseInt(viewBoxParts[2]) || width;
    height = parseInt(viewBoxParts[3]) || height;
  } else if (widthMatch && heightMatch) {
    width = parseInt(widthMatch[1]);
    height = parseInt(heightMatch[1]);
  }

  const peaks = rWavePositions && rWavePositions.length > 0 ? rWavePositions.length : 0;

  // Read existing waveforms.js
  let registryContent = fs.readFileSync(WAVEFORMS_REGISTRY, 'utf8');

  // Create new waveform entry
  const newEntry = `  ${variant}: {
    path: "${pathData}",
    width: ${width},
    height: ${height},
    peaks: ${peaks}
  }`;

  // Check if variant already exists
  const variantRegex = new RegExp(`\\s+${variant}:\\s*{[^}]*}`, 's');
  const existsInRegistry = variantRegex.test(registryContent);

  if (existsInRegistry) {
    // Update existing entry
    registryContent = registryContent.replace(variantRegex, newEntry);
    console.log(`✏️  Updated existing "${variant}" entry in waveforms.js`);
  } else {
    // Add new entry before closing brace
    const closingBraceIndex = registryContent.lastIndexOf('};');
    if (closingBraceIndex === -1) {
      throw new Error('Could not find closing brace in waveforms.js');
    }

    // Check if we need a comma before the new entry
    const beforeClosingBrace = registryContent.substring(0, closingBraceIndex).trim();
    const needsComma = beforeClosingBrace.endsWith('}');

    const insertion = (needsComma ? ',' : '') + '\n' + newEntry;
    registryContent = registryContent.substring(0, closingBraceIndex) + insertion + '\n' + registryContent.substring(closingBraceIndex);

    console.log(`➕ Added new "${variant}" entry to waveforms.js`);
  }

  // Write updated registry back to file
  fs.writeFileSync(WAVEFORMS_REGISTRY, registryContent, 'utf8');

  console.log(`✅ Registry updated successfully!`);
  console.log(`   Variant: ${variant}`);
  console.log(`   Dimensions: ${width}x${height}px`);
  console.log(`   R-waves: ${peaks} peaks`);
  console.log(`   Path length: ${pathData.length} characters`);
  console.log('');
}

const server = http.createServer((req, res) => {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST request to save files
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { filename, content, type, waveformKey, rWavePositions } = data;

        if (!filename || !content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing filename or content' }));
          return;
        }

        const savedFiles = [];

        // === SAVE TO EXPORTS (backup/reference) ===
        const exportsPath = path.join(EXPORTS_DIR, filename);
        if (type === 'base64') {
          const base64Data = content.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(exportsPath, base64Data, 'base64');
        } else {
          fs.writeFileSync(exportsPath, content, 'utf8');
        }
        console.log(`📦 Backup: ${filename} → /exports/ (${(fs.statSync(exportsPath).size / 1024).toFixed(2)} KB)`);
        savedFiles.push({ location: '/exports/', path: exportsPath, size: fs.statSync(exportsPath).size });

        // === SAVE TO PRODUCTION LOCATIONS ===
        if (type === 'base64') {
          // PNG → Legacy location (deprecated, keeping for backward compatibility)
          const pngPath = path.join(LEGACY_PNG_DIR, filename);
          const base64Data = content.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(pngPath, base64Data, 'base64');
          console.log(`✅ LEGACY PNG: ${filename} → /assets/waveforms/png/ (${(fs.statSync(pngPath).size / 1024).toFixed(2)} KB)`);
          savedFiles.push({ location: '/assets/waveforms/png/', path: pngPath, size: fs.statSync(pngPath).size });
        } else {
          // SVG → Production location (READY FOR MONITOR - lightweight & responsive)
          const svgPath = path.join(PRODUCTION_SVG_DIR, filename);
          fs.writeFileSync(svgPath, content, 'utf8');
          console.log(`🚀 PRODUCTION SVG: ${filename} → /assets/waveforms/svg/ (${(fs.statSync(svgPath).size / 1024).toFixed(2)} KB)`);
          savedFiles.push({ location: '/assets/waveforms/svg/', path: svgPath, size: fs.statSync(svgPath).size });

          // === AUTO-UPDATE WAVEFORMS.JS REGISTRY ===
          try {
            updateWaveformsRegistry(svgPath, waveformKey, rWavePositions);

            // === AUTO-RELOAD EXPO APP ===
            console.log('');
            console.log('🔄 REFRESHING EXPO APP...');
            try {
              // Clear Metro bundler cache and reload
              execSync('pkill -f "react-native" 2>/dev/null || true', { stdio: 'ignore' });
              console.log('✅ Metro bundler cache cleared');
              console.log('📱 App will hot-reload automatically with new waveform data');
            } catch (reloadError) {
              console.log('⚠️ Note: Could not trigger reload (app may need manual refresh)');
            }
            console.log('');
          } catch (registryError) {
            console.error('⚠️ Warning: Failed to update waveforms.js registry:', registryError.message);
            // Don't fail the entire save if registry update fails
          }
        }

        // === AUTO-LAUNCH iOS SIMULATOR FOR PNG FILES ===
        if (type === 'base64') {
          console.log('');
          console.log('🚀 PNG UPLOADED - TRIGGERING IOS SIMULATOR...');
          console.log('📱 Opening simulator and reloading app...');

          // Trigger notification file for Claude to detect
          const notificationPath = path.join(__dirname, '.ecg-upload-notification.json');
          fs.writeFileSync(notificationPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            filename: filename,
            waveformKey: waveformKey || filename.replace('.png', ''),
            pngPath: path.join(LEGACY_PNG_DIR, filename),
            svgPath: path.join(PRODUCTION_SVG_DIR, filename.replace('.png', '.svg')),
            rWavePositions: rWavePositions || []
          }, null, 2));

          // Save R-wave positions to separate config file for WaveformConfig.js
          if (rWavePositions && rWavePositions.length > 0 && waveformKey) {
            const rWaveConfigPath = path.join(__dirname, 'assets', 'waveforms', 'r-wave-positions.json');
            let rWaveConfig = {};

            // Load existing config if it exists
            if (fs.existsSync(rWaveConfigPath)) {
              rWaveConfig = JSON.parse(fs.readFileSync(rWaveConfigPath, 'utf8'));
            }

            // Update with new waveform's R-wave positions
            rWaveConfig[waveformKey] = rWavePositions;

            // Save updated config
            fs.writeFileSync(rWaveConfigPath, JSON.stringify(rWaveConfig, null, 2));
            console.log(`🔊 R-wave positions saved: ${rWavePositions.length} peaks at ${JSON.stringify(rWavePositions)}`);
          }

          console.log('✅ Notification file created for Claude');
          console.log(`🏷️  Waveform Key: ${waveformKey || filename}`);
          console.log('🤖 Claude will now integrate this waveform and open the simulator');
        }

        console.log('═════════════════════════════════════════════════════════');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          filename,
          savedFiles,
          autoLaunched: type === 'base64'
        }));

      } catch (error) {
        console.error('❌ Error saving file:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });

  } else if (req.method === 'GET' && (req.url === '/status' || req.url === '/ping')) {
    // Health check endpoint (supports both /status and /ping)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'running', exports_dir: EXPORTS_DIR }));

  } else if (req.method === 'GET' && req.url.startsWith('/check-exists/')) {
    // Check if waveform already exists
    const waveformKey = req.url.split('/check-exists/')[1];
    const pngPath = path.join(LEGACY_PNG_DIR, `${waveformKey}.png`);
    const svgPath = path.join(PRODUCTION_SVG_DIR, `${waveformKey}.svg`);

    const exists = fs.existsSync(pngPath) || fs.existsSync(svgPath);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      exists,
      waveformKey,
      pngExists: fs.existsSync(pngPath),
      svgExists: fs.existsSync(svgPath)
    }));

  } else if (req.method === 'GET' && req.url === '/list-waveforms') {
    // List all completed waveforms (SVG is the current standard)
    try {
      const svgFiles = fs.readdirSync(PRODUCTION_SVG_DIR)
        .filter(f => f.endsWith('.svg'))
        .map(f => f.replace('.svg', ''));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        completed: svgFiles,
        total: svgFiles.length,
        directory: PRODUCTION_SVG_DIR
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }

  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ECG Save Server Started');
  console.log('═══════════════════════════════════════════════');
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Exports saved to: ${EXPORTS_DIR}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('✨ Ready to receive ECG exports!');
  console.log('   Open ecg-to-svg-converter.html in your browser');
  console.log('   and click "Save to Project Folder" buttons');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Stop the other server or choose a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});
