const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCRIPT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

function getOAuth2Client() {
  const credentialsPath = path.join(__dirname, '../config/credentials.json');
  const tokenPath = path.join(__dirname, '../config/token.json');
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function createCompleteMenu() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Getting current files...\n');
  
  const getResponse = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = getResponse.data.files;
  
  const codeFile = files.find(f => f.name === 'Code');
  if (!codeFile) {
    console.log('❌ Code.gs not found');
    return;
  }
  
  console.log('🔄 Creating complete menu with all working functions...\n');
  
  // Find the current onOpen function
  const onOpenStart = codeFile.source.indexOf('function onOpen()');
  if (onOpenStart === -1) {
    console.log('❌ onOpen() not found');
    return;
  }
  
  // Find the end of onOpen
  let braceCount = 0;
  let inFunction = false;
  let onOpenEnd = onOpenStart;
  
  for (let i = onOpenStart; i < codeFile.source.length; i++) {
    if (codeFile.source[i] === '{') {
      inFunction = true;
      braceCount++;
    } else if (codeFile.source[i] === '}') {
      braceCount--;
      if (inFunction && braceCount === 0) {
        onOpenEnd = i + 1;
        break;
      }
    }
  }
  
  const newOnOpen = `function onOpen() {
  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('🧠 Sim Builder');

  // Core Tools
  menu.addItem('🎨 ATSR Titles Optimizer', 'runATSRTitleGenerator');
  menu.addItem('🧩 Categories & Pathways', 'runPathwayChainBuilder');
  menu.addItem('🤖 Ultimate Categorization Tool', 'openUltimateCategorization');
  menu.addSeparator();
  menu.addItem('🚀 Batch Processing', 'openSimSidebar');
  menu.addSeparator();

  // Cache Management Submenu
  menu.addSubMenu(ui.createMenu('🗄️ Cache Management')
    .addItem('📋 Field Selector', 'showFieldSelector')
    .addItem('📦 Cache Next 25 Rows', 'cacheNext25RowsWithFields')
    .addSeparator()
    .addItem('👁️ View Saved Fields', 'showSavedFieldSelection')
    .addItem('📊 Check Cache Status', 'getCacheStatus')
    .addSeparator()
    .addItem('🔄 Reset Cache Progress', 'resetCacheProgress')
    .addItem('🧹 Clear Cache Sheet', 'clearCacheSheet')
  );

  // Waveform Mapping Submenu
  menu.addSubMenu(ui.createMenu('📈 Waveform Mapping')
    .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
    .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
    .addSeparator()
    .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
    .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
  );

  menu.addToUi();
}`;
  
  // Replace the onOpen function
  codeFile.source = codeFile.source.substring(0, onOpenStart) + newOnOpen + codeFile.source.substring(onOpenEnd);
  
  console.log('✅ Complete menu created with:');
  console.log('   Core Tools:');
  console.log('     - 🎨 ATSR Titles Optimizer');
  console.log('     - 🧩 Categories & Pathways');
  console.log('     - 🤖 Ultimate Categorization Tool');
  console.log('     - 🚀 Batch Processing');
  console.log('   Submenus:');
  console.log('     - 🗄️ Cache Management (6 items)');
  console.log('     - 📈 Waveform Mapping (4 items)\n');
  
  console.log('💾 Deploying...');
  
  // Send ALL files back
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('✅ Complete menu deployed!');
  console.log('\n🔍 Please refresh your Google Sheet.');
}

createCompleteMenu().catch(console.error);
