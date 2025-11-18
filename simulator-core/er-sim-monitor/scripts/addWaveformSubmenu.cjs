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

async function addWaveformSubmenu() {
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
  
  console.log('🔍 Finding onOpen function...');
  
  // Find onOpen and where to add the waveform submenu
  const menuAddToUi = '  menu.addToUi();';
  
  if (!codeFile.source.includes(menuAddToUi)) {
    console.log('❌ Could not find menu.addToUi() line');
    return;
  }
  
  // Check if waveform submenu already exists
  if (codeFile.source.includes('Waveform Mapping') || codeFile.source.includes('suggestWaveformMapping')) {
    console.log('⚠️  Waveform menu items already exist in onOpen - need to organize them');
    
    // For now, just add the submenu before menu.addToUi()
    const waveformSubmenu = `
  // Waveform Mapping Submenu
  menu.addSubMenu(ui.createMenu('📈 Waveform Mapping')
    .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
    .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
    .addSeparator()
    .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
    .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
  );

`;
    
    codeFile.source = codeFile.source.replace(menuAddToUi, waveformSubmenu + menuAddToUi);
  } else {
    console.log('✅ Adding new Waveform Mapping submenu...');
    
    const waveformSubmenu = `
  // Waveform Mapping Submenu
  menu.addSubMenu(ui.createMenu('📈 Waveform Mapping')
    .addItem('🩺 Suggest Waveform Mapping', 'suggestWaveformMapping')
    .addItem('🔄 Auto-Map All Waveforms', 'autoMapAllWaveforms')
    .addSeparator()
    .addItem('📊 Analyze Current Mappings', 'analyzeCurrentMappings')
    .addItem('❌ Clear All Waveforms', 'clearAllWaveforms')
  );

`;
    
    codeFile.source = codeFile.source.replace(menuAddToUi, waveformSubmenu + menuAddToUi);
  }
  
  console.log('💾 Deploying updated menu...');
  
  // Send ALL files back
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files: files }
  });
  
  console.log('✅ Waveform Mapping submenu added!');
  console.log('\n🔍 Please refresh your Google Sheet to see the updated menu.');
}

addWaveformSubmenu().catch(console.error);
