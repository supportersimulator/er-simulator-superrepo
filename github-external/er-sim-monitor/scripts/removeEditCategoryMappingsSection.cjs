/**
 * Temporarily Remove Edit Category Mappings Section
 *
 * This section has template literal syntax errors causing ALL JavaScript to fail.
 * We'll remove it, test AI Categorization (Specific Rows), then add it back
 * with a cleaner implementation.
 *
 * Strategy: Find the section, save it to a backup file, replace with comment
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔧 Temporarily Removing Edit Category Mappings Section\n');
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

  console.log('📥 Downloading project...\n');

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  console.log('✅ Found Phase2_Enhanced_Categories_With_AI.gs\n');

  let source = panelFile.source;

  console.log('🔍 Finding Edit Category Mappings section...\n');

  // Find the Edit Category Mappings button and everything related to it
  // This includes the button, modal, and script block

  // Pattern: From the "Edit Category Mappings" button to the end of its modal/script
  const editMappingsPattern = /<button[^>]*>⚙️ Edit Category Mappings[\s\S]*?<\/script>\s*<!-- End of Edit Mappings Modal -->/;

  const match = source.match(editMappingsPattern);

  if (match) {
    console.log('✅ Found Edit Category Mappings section\n');
    console.log('   Size:', Math.round(match[0].length / 1024), 'KB\n');

    // Save the removed section to a backup file
    const backupPath = '/Users/aarontjomsland/er-sim-monitor/backups/edit_category_mappings_section.html';

    if (!fs.existsSync('/Users/aarontjomsland/er-sim-monitor/backups')) {
      fs.mkdirSync('/Users/aarontjomsland/er-sim-monitor/backups', { recursive: true });
    }

    fs.writeFileSync(backupPath, match[0]);
    console.log('💾 Backed up to:', backupPath, '\n');

    // Replace with a comment
    const replacement = `
<!-- ═══════════════════════════════════════════════════════════════════════
     EDIT CATEGORY MAPPINGS SECTION TEMPORARILY REMOVED

     Reason: Template literal syntax errors in JavaScript were preventing
             ALL JavaScript from executing, breaking AI Categorization panel

     Location: This section had a modal with addNewRow(), deleteRow() functions
               that used template literals inside backtick strings, causing
               Apps Script to fail during HTML rendering

     Backup: /Users/aarontjomsland/er-sim-monitor/backups/edit_category_mappings_section.html

     Restoration: Will add back with string concatenation instead of template literals
     ═══════════════════════════════════════════════════════════════════════ -->`;

    source = source.replace(editMappingsPattern, replacement);

    console.log('✅ Replaced with explanatory comment\n');
  } else {
    console.log('⚠️  Edit Category Mappings section not found using pattern\n');
    console.log('Trying alternative approach...\n');

    // Alternative: Find the button and the script block separately
    const buttonPattern = /<button class="button"[^>]*>\s*⚙️ Edit Category Mappings[\s\S]*?<\/button>/;
    const scriptPattern = /<script>[\s\S]*?function addNewRow\(\)[\s\S]*?<\/script>/;

    let removedSomething = false;

    if (buttonPattern.test(source)) {
      console.log('✅ Found Edit Category Mappings button\n');
      source = source.replace(buttonPattern, '<!-- Edit Category Mappings button removed (temporary) -->');
      removedSomething = true;
    }

    if (scriptPattern.test(source)) {
      console.log('✅ Found addNewRow script block\n');
      const scriptMatch = source.match(scriptPattern);
      if (scriptMatch) {
        // Save it
        fs.writeFileSync('/Users/aarontjomsland/er-sim-monitor/backups/edit_mappings_script_block.html', scriptMatch[0]);
        console.log('💾 Backed up script to: /Users/aarontjomsland/er-sim-monitor/backups/edit_mappings_script_block.html\n');
      }
      source = source.replace(scriptPattern, '<!-- Edit Category Mappings script block removed (temporary) -->');
      removedSomething = true;
    }

    if (!removedSomething) {
      console.log('❌ Could not find Edit Category Mappings section\n');
      return;
    }
  }

  panelFile.source = source;

  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🚀 Deploying cleaned version...\n');

  await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: { files: project.data.files }
  });

  console.log('✅ Deployment complete!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('🎯 EDIT CATEGORY MAPPINGS SECTION REMOVED!\n');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('What we did:');
  console.log('  ✅ Removed Edit Category Mappings button + modal + script');
  console.log('  ✅ Backed up removed section to /backups/');
  console.log('  ✅ This should fix ALL JavaScript syntax errors\n');
  console.log('What remains:');
  console.log('  ✅ AI Categorization (with Specific Rows mode)');
  console.log('  ✅ Retry Failed Cases');
  console.log('  ✅ Clear Results');
  console.log('  ✅ All categories/pathways viewing\n');
  console.log('Next steps:');
  console.log('  1. Hard refresh Google Sheet (Cmd+Shift+R)');
  console.log('  2. Open AI Categorization panel');
  console.log('  3. Console should be CLEAN - no syntax errors!');
  console.log('  4. Select "Specific Rows" - input field SHOULD appear!');
  console.log('  5. Button text should change!\n');
  console.log('After testing:');
  console.log('  - We\'ll restore Edit Category Mappings with fixed implementation\n');
}

main().catch(console.error);
