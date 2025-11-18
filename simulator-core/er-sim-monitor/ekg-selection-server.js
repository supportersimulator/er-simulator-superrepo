import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3334; // Different port from live-sync (3333)

const server = http.createServer((req, res) => {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST request with selections
  if (req.method === 'POST' && req.url === '/submit-favorites') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        console.log('\n🎨 ===================================');
        console.log('📋 EKG ICON FAVORITES RECEIVED');
        console.log('🎨 ===================================\n');

        console.log('✅ Selected Variants:');
        data.selections.forEach(selection => {
          console.log(`   • ${selection.name}`);
          console.log(`     State: ${selection.state}`);
          console.log(`     Size: ${selection.size}`);
          if (selection.notes) {
            console.log(`     Notes: ${selection.notes}`);
          }
          console.log('');
        });

        if (data.generalNotes) {
          console.log('💬 General Notes:');
          console.log(`   ${data.generalNotes}\n`);
        }

        console.log('🎨 ===================================\n');

        // Save to file for reference
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ekg-favorites-${timestamp}.json`;
        const filepath = path.join(__dirname, 'data', filename);

        // Ensure data directory exists
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`💾 Saved to: ${filename}\n`);

        // Send success response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Favorites received! Check the terminal for details.',
          savedTo: filename
        }));

      } catch (error) {
        console.error('❌ Error processing submission:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          message: 'Error processing submission'
        }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log('\n🎨 ===================================');
  console.log('🚀 EKG Selection Server Running');
  console.log('🎨 ===================================');
  console.log(`📡 Listening on port ${PORT}`);
  console.log('📋 Ready to receive your favorite EKG selections');
  console.log('🎨 ===================================\n');
});
