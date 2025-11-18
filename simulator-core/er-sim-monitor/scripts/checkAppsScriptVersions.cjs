const https = require('https');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

async function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  return clasprc.tokens.default.access_token;
}

async function apiRequest(method, endpoint, token) {
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
    req.end();
  });
}

async function checkVersions() {
  console.log('Checking Apps Script version history...');
  const token = await getAccessToken();

  const versions = await apiRequest(
    'GET',
    `/v1/projects/${SCRIPT_ID}/versions`,
    token
  );

  console.log('\nRecent versions:');
  if (versions.versions) {
    versions.versions.slice(0, 20).forEach(v => {
      const desc = v.description || 'No description';
      console.log(`Version ${v.versionNumber}: ${v.createTime} - ${desc}`);
    });
  } else {
    console.log('No versions found');
  }
}

checkVersions().catch(console.error);
