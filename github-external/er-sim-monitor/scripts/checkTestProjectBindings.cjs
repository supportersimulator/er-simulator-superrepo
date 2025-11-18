#!/usr/bin/env node

/**
 * CHECK IF TEST PROJECT IS CALLING EXTERNAL SCRIPTS
 * Check for libraries, advanced services, or external script references
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const TEST_PROJECT_ID = '1HIw4Ok4G88YzHsECb5e_GvJH9XYefEY59pHXalFstiddLciyHXC06zNf';

console.log('\n🔍 CHECKING TEST PROJECT FOR EXTERNAL SCRIPT REFERENCES\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function checkBindings() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    console.log(`🎯 TEST Project ID: ${TEST_PROJECT_ID}\n`);
    console.log('📥 Downloading project files...\n');

    const project = await script.projects.getContent({
      scriptId: TEST_PROJECT_ID
    });

    // Find manifest file
    const manifestFile = project.data.files.find(f => f.name === 'appsscript');

    if (manifestFile && manifestFile.source) {
      console.log('📄 MANIFEST FILE (appsscript.json):\n');
      console.log('═══════════════════════════════════════════════════════════════\n');

      const manifest = JSON.parse(manifestFile.source);
      console.log(JSON.stringify(manifest, null, 2));
      console.log('\n═══════════════════════════════════════════════════════════════\n');

      // Check for libraries
      if (manifest.dependencies && manifest.dependencies.libraries) {
        console.log('📚 EXTERNAL LIBRARIES DETECTED:\n');
        manifest.dependencies.libraries.forEach((lib, index) => {
          console.log(`${index + 1}. ${lib.userSymbol || 'Unknown'}`);
          console.log(`   Library ID: ${lib.libraryId}`);
          console.log(`   Version: ${lib.version}`);
          console.log(`   Dev Mode: ${lib.developmentMode || false}`);
          console.log('');
        });
        console.log('⚠️  This could be the problem! The project might be loading');
        console.log('   external ATSR code via a library reference.\n');
      } else {
        console.log('✅ No external libraries configured\n');
      }

      // Check for advanced services
      if (manifest.dependencies && manifest.dependencies.enabledAdvancedServices) {
        console.log('🔧 ADVANCED SERVICES:\n');
        manifest.dependencies.enabledAdvancedServices.forEach((svc, index) => {
          console.log(`${index + 1}. ${svc.userSymbol}`);
          console.log(`   Service ID: ${svc.serviceId}`);
          console.log(`   Version: ${svc.version}`);
          console.log('');
        });
      } else {
        console.log('✅ No advanced services enabled\n');
      }

      // Check for webapp settings
      if (manifest.webapp) {
        console.log('🌐 WEB APP CONFIGURATION:\n');
        console.log(JSON.stringify(manifest.webapp, null, 2));
        console.log('');
      }

      // Check for script properties
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('🔑 Checking for Script Properties that might reference external code...\n');

      // Check Code.gs for external script ID references
      const codeFile = project.data.files.find(f => f.name === 'Code');
      if (codeFile && codeFile.source) {
        console.log('📝 Searching Code.gs for external script ID patterns...\n');

        // Look for script IDs (format: alphanumeric + hyphens + underscores)
        const scriptIdPattern = /['"]([a-zA-Z0-9_-]{30,})['\"]/g;
        const matches = [...codeFile.source.matchAll(scriptIdPattern)];

        const suspiciousIds = matches
          .map(m => m[1])
          .filter(id => id.length > 30) // Script IDs are typically 40+ chars
          .filter((id, index, self) => self.indexOf(id) === index); // unique

        if (suspiciousIds.length > 0) {
          console.log(`⚠️  FOUND ${suspiciousIds.length} POTENTIAL SCRIPT ID REFERENCES:\n`);
          suspiciousIds.forEach((id, index) => {
            // Find context around the ID
            const idIndex = codeFile.source.indexOf(id);
            const start = Math.max(0, idIndex - 100);
            const end = Math.min(codeFile.source.length, idIndex + id.length + 100);
            const context = codeFile.source.substring(start, end);

            console.log(`${index + 1}. ${id}`);
            console.log(`   Context: ...${context}...`);
            console.log('');
          });
          console.log('⚠️  These IDs might be references to external scripts!\n');
        } else {
          console.log('✅ No external script ID references found in Code.gs\n');
        }

        // Look for ScriptApp.getScriptId() calls
        if (codeFile.source.includes('ScriptApp.getScriptId()')) {
          console.log('⚠️  Code uses ScriptApp.getScriptId() - might be comparing IDs\n');
        }

        // Look for library references
        if (codeFile.source.match(/\w+\.\w+\.\w+\(/)) {
          console.log('⚠️  Code has patterns like "Library.function()" - might use libraries\n');
        }
      }

      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('📊 SUMMARY:\n');

      const hasLibraries = manifest.dependencies && manifest.dependencies.libraries && manifest.dependencies.libraries.length > 0;
      const hasAdvancedServices = manifest.dependencies && manifest.dependencies.enabledAdvancedServices;

      if (hasLibraries) {
        console.log('❌ POTENTIAL ISSUE: External libraries are configured\n');
        console.log('   The test project might be loading ATSR code from a library\n');
        console.log('   instead of using the container-bound code.\n');
      } else if (hasAdvancedServices) {
        console.log('⚠️  Project uses advanced services (probably OK)\n');
      } else {
        console.log('✅ No external code references in manifest\n');
        console.log('   The mystery button issue must be something else.\n');
      }

      console.log('═══════════════════════════════════════════════════════════════\n');

      // Save manifest
      const manifestPath = path.join(__dirname, '../backups/test-manifest-2025-11-06.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log(`💾 Manifest saved: ${manifestPath}\n`);

    } else {
      console.log('❌ No manifest file found in project\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

checkBindings();
