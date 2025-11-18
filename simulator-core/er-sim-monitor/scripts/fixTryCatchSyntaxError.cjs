/**
 * Fix Try-Catch Syntax Error
 *
 * The window.runAICategorization function has an unclosed try block
 * Missing catch or finally block is preventing entire script from executing
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Fixing Try-Catch Syntax Error\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  const token = JSON.parse(fs.readFileSync('./config/token.json', 'utf-8'));
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );
  oAuth2Client.setCredentials(token);

  const script = google.script({ version: 'v1', auth: oAuth2Client });
  const scriptId = process.env.APPS_SCRIPT_ID;

  console.log('📥 Downloading current project...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  let html = panelFile.source;

  console.log('📝 Finding the unclosed try block...\n');

  // Find the pattern: try block followed directly by closing brace and then other code
  // The issue is: try { ... } with no catch or finally

  // Pattern to find: .runAICategorization(mode, specificInput); followed by just }
  const pattern = /\.runAICategorization\(mode, specificInput\);[\s\r\n]+\}/;

  if (!pattern.test(html)) {
    console.log('❌ Could not find the exact pattern to fix\n');
    return;
  }

  console.log('✅ Found the unclosed try block\n');
  console.log('📝 Adding catch block...\n');

  // Replace: .runAICategorization(mode, specificInput);\n    }
  // With: .runAICategorization(mode, specificInput);\n      } catch (error) {\n        console.error('❌ Error:', error);\n        alert('JavaScript Error: ' + error.message);\n      }\n    }

  html = html.replace(
    /\.runAICategorization\(mode, specificInput\);([\s\r\n]+)\}/,
    `.runAICategorization(mode, specificInput);$1      } catch (error) {
        console.error('❌ Error in runAICategorization():', error);
        alert('JavaScript Error: ' + error.message);
      }
    }`
  );

  console.log('✅ Added catch block\n');

  panelFile.source = html;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying fix...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 Try-Catch Syntax Error Fixed!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What was fixed:');
  console.log('  ❌ Before: try { ... } with no catch');
  console.log('  ✅ After: try { ... } catch (error) { ... }\n');
  console.log('This was preventing the ENTIRE first script block from executing,');
  console.log('which is why window.runAICategorization was never defined!\n');
  console.log('Next steps:');
  console.log('  1. Refresh Google Sheet (F5)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Check console for "📝 About to define window.runAICategorization"');
  console.log('  4. Select "Specific Rows" mode');
  console.log('  5. Paste the 19 Case IDs');
  console.log('  6. Click Run button - IT SHOULD WORK NOW!\n');
}

main().catch(console.error);
