#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TEST_SCRIPT_ID = '1kkPZU3GsCCuu5IhTEOufmDT1Cb2rSQVB3Y3u1DPf87yoSV4WVtoNvd6i';

async function authorize() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function fix() {
  console.log('\n🔧 FIXING CACHED_HEADER2 + COMPLETING INTEGRATION\n');
  console.log('════════════════════════════════════════════════════\n');

  const auth = await authorize();
  const script = google.script({ version: 'v1', auth });

  try {
    const project = await script.projects.getContent({ scriptId: TEST_SCRIPT_ID });
    const enrichmentFile = project.data.files.find(f => f.name === 'Multi_Step_Cache_Enrichment');
    const phase2File = project.data.files.find(f => f.name === 'Categories_Pathways_Feature_Phase2');

    let changes = [];

    // Fix enrichment file
    if (enrichmentFile) {
      let code = enrichmentFile.source;
      const original = code;
      
      // Replace getProp with PropertiesService
      code = code.replace(/getProp\('CACHED_HEADER2'\)/g, "PropertiesService.getDocumentProperties().getProperty('CACHED_HEADER2')");
      
      if (code !== original) {
        enrichmentFile.source = code;
        changes.push('✅ Fixed CACHED_HEADER2 property access in Multi_Step_Cache_Enrichment');
      }
    }

    // Fix phase2 file - add refreshHeaders to discover function
    if (phase2File) {
      let code = phase2File.source;
      const original = code;
      
      // Find discoverNovelPathwaysWithAI_ and add refreshHeaders if not present
      if (!code.match(/discoverNovelPathwaysWithAI_[\s\S]{0,300}refreshHeaders/)) {
        // Find the function start and add refreshHeaders after opening brace
        const discoverMatch = code.match(/(function discoverNovelPathwaysWithAI_\([^)]*\) \{\s*\n)/);
        
        if (discoverMatch) {
          const replacement = discoverMatch[0] + '  // Refresh headers before analysis\n  refreshHeaders();\n  \n';
          code = code.replace(discoverMatch[0], replacement);
          changes.push('✅ Added refreshHeaders() to discoverNovelPathwaysWithAI_');
        }
      }
      
      if (code !== original) {
        phase2File.source = code;
      }
    }

    if (changes.length > 0) {
      console.log('🚀 Deploying changes...\n');

      await script.projects.updateContent({
        scriptId: TEST_SCRIPT_ID,
        requestBody: {
          files: project.data.files
        }
      });

      console.log('════════════════════════════════════════════════════');
      console.log('✅ CHANGES DEPLOYED:\n');
      changes.forEach(c => console.log('   ' + c));
      console.log('\n════════════════════════════════════════════════════\n');
    } else {
      console.log('✅ No changes needed - already up to date\n');
    }

  } catch (e) {
    console.log('\n❌ Failed: ' + e.message + '\n');
    if (e.stack) {
      console.log(e.stack);
    }
  }
}

fix().catch(console.error);
