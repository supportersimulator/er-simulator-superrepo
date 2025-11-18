const https = require('https');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';
const VERSION_NUMBER = 1; // Version from Nov 11

async function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  if (!fs.existsSync(clasprcPath)) {
    throw new Error('No .clasprc.json found');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  return clasprc.tokens.default.access_token;
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

async function restoreVersion() {
  console.log(`Restoring version ${VERSION_NUMBER}...`);
  const token = await getAccessToken();

  // Get the version content
  console.log('Getting version content...');
  const version = await apiRequest(
    'GET',
    `/v1/projects/${SCRIPT_ID}/versions/${VERSION_NUMBER}`,
    null,
    token
  );

  console.log(`Version ${VERSION_NUMBER} has ${version.files.length} files`);
  version.files.forEach(f => console.log(`  - ${f.name} (${f.type})`));

  // Add manifest if missing
  const hasManifest = version.files.some(f => f.name === 'appsscript');
  if (!hasManifest) {
    console.log('Adding manifest file...');
    version.files.push({
      name: 'appsscript',
      type: 'JSON',
      source: JSON.stringify({
        timeZone: 'America/Los_Angeles',
        dependencies: {},
        exceptionLogging: 'STACKDRIVER',
        runtimeVersion: 'V8'
      })
    });
  }

  // Update the project with this version's content
  console.log('Restoring to current HEAD...');
  const result = await apiRequest(
    'PUT',
    `/v1/projects/${SCRIPT_ID}/content`,
    { files: version.files },
    token
  );

  console.log('✅ Version restored successfully!');
  console.log('Files restored:', result.files.length);
}

restoreVersion().catch(console.error);
