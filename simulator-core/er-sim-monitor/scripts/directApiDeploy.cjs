#!/usr/bin/env node
/**
 * Direct Apps Script API Deployment
 * Uses Google Apps Script API directly to bypass clasp auth issues
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';
const FIXED_FILE = path.join(__dirname, '..', 'apps-script-deployable', 'Ultimate_Categorization_Tool_Complete.gs');

async function getAccessToken() {
  // Try to read from clasp config
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');

  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found. Run: clasp login');
  }

  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const token = clasprc.tokens?.default?.access_token;

  if (!token) {
    throw new Error('No access token found in .clasprc.json');
  }

  return token;
}

async function apiRequest(method, endpoint, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'script.googleapis.com',
      path: endpoint,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function deployFix() {
  console.log('🚀 Direct API Deployment Starting...');
  console.log('');

  // Get access token
  console.log('🔑 Getting OAuth token...');
  let token;
  try {
    token = await getAccessToken();
    console.log('✅ Token retrieved');
  } catch (error) {
    console.error('❌ Could not get OAuth token:', error.message);
    console.log('');
    console.log('Please run: clasp login');
    process.exit(1);
  }
  console.log('');

  // Read fixed file
  console.log('📖 Reading fixed file...');
  if (!fs.existsSync(FIXED_FILE)) {
    console.error('❌ Fixed file not found:', FIXED_FILE);
    process.exit(1);
  }

  const fixedContent = fs.readFileSync(FIXED_FILE, 'utf8');
  console.log(`✅ Loaded ${(fixedContent.length / 1024).toFixed(1)} KB`);
  console.log('');

  // Get current project content
  console.log('⬇️  Fetching current project content...');
  let currentContent;
  try {
    currentContent = await apiRequest(
      'GET',
      `/v1/projects/${SCRIPT_ID}/content`,
      null,
      token
    );
    console.log(`✅ Current project has ${currentContent.files.length} files`);
  } catch (error) {
    console.error('❌ Could not fetch project:', error.message);
    process.exit(1);
  }
  console.log('');

  // Find and replace the categorization tool file
  console.log('🔧 Replacing Ultimate_Categorization_Tool_Complete...');

  let found = false;
  const updatedFiles = currentContent.files.map(file => {
    if (file.name === 'Ultimate_Categorization_Tool_Complete') {
      found = true;
      return {
        name: file.name,
        type: file.type,
        source: fixedContent
      };
    }
    return file;
  });

  if (!found) {
    console.log('⚠️  File not found in project, adding new file');
    updatedFiles.push({
      name: 'Ultimate_Categorization_Tool_Complete',
      type: 'SERVER_JS',
      source: fixedContent
    });
  }

  // Push updated content
  console.log('📤 Pushing updated content...');
  try {
    await apiRequest(
      'PUT',
      `/v1/projects/${SCRIPT_ID}/content`,
      { files: updatedFiles },
      token
    );
    console.log('✅ Content pushed successfully!');
  } catch (error) {
    console.error('❌ Push failed:', error.message);
    process.exit(1);
  }
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 DEPLOYMENT SUCCESSFUL!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ AI Categorizer fix deployed');
  console.log('✅ Now uses sheet GID: 1564998840');
  console.log('✅ Other tools preserved unchanged');
  console.log('');
  console.log('Next: Test in spreadsheet');
  console.log('https://docs.google.com/spreadsheets/d/1EVSC6j7zUeNw_D7dOV3dx7eRyMd3T6PVrVVazKYIkaM/edit');
  console.log('');
}

deployFix().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
