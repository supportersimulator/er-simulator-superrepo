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

async function analyzeFiles() {
  const auth = getOAuth2Client();
  const script = google.script({ version: 'v1', auth });
  
  console.log('📥 Analyzing all project files...\n');
  
  const res = await script.projects.getContent({ scriptId: SCRIPT_ID });
  const files = res.data.files;
  
  console.log('FILE ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Functions referenced in the menu
  const menuFunctions = [
    'runATSRTitleGenerator',
    'runPathwayChainBuilder',
    'openUltimateCategorization',
    'openSimSidebar',
    'suggestWaveformMapping',
    'autoMapAllWaveforms',
    'analyzeCurrentMappings',
    'clearAllWaveforms'
  ];
  
  console.log('CHECKING WHICH FILES CONTAIN MENU FUNCTIONS:\n');
  
  const functionLocations = {};
  menuFunctions.forEach(fn => functionLocations[fn] = []);
  
  files.forEach(file => {
    if (file.type !== 'SERVER_JS') return;
    
    menuFunctions.forEach(fn => {
      const pattern = new RegExp('function\\s+' + fn + '\\s*\\(');
      if (pattern.test(file.source)) {
        functionLocations[fn].push(file.name);
      }
    });
  });
  
  menuFunctions.forEach(fn => {
    const locations = functionLocations[fn];
    if (locations.length === 0) {
      console.log('❌ ' + fn + ': NOT FOUND IN ANY FILE');
    } else if (locations.length === 1) {
      console.log('✅ ' + fn + ': ' + locations[0]);
    } else {
      console.log('⚠️  ' + fn + ': DUPLICATE in ' + locations.length + ' files:');
      locations.forEach(loc => console.log('     - ' + loc));
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('FILE PURPOSE ANALYSIS:\n');
  
  files.forEach(file => {
    if (file.type !== 'SERVER_JS') return;
    
    console.log('📄 ' + file.name + ' (' + file.source.length + ' chars)');
    
    // Check what this file contains
    const hasOnOpen = file.source.includes('function onOpen()');
    const hasUI = file.source.includes('HtmlService') || file.source.includes('createMenu');
    const hasCategorization = file.source.includes('categor') || file.source.includes('Categor');
    const hasPathways = file.source.includes('pathway') || file.source.includes('Pathway');
    const hasWaveform = file.source.includes('waveform') || file.source.includes('Waveform');
    const hasAI = file.source.includes('OpenAI') || file.source.includes('AI_');
    
    const features = [];
    if (hasOnOpen) features.push('onOpen()');
    if (hasUI) features.push('UI/HTML');
    if (hasCategorization) features.push('Categorization');
    if (hasPathways) features.push('Pathways');
    if (hasWaveform) features.push('Waveforms');
    if (hasAI) features.push('AI');
    
    if (features.length > 0) {
      console.log('   Features: ' + features.join(', '));
    }
    
    console.log('');
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
}

analyzeFiles().catch(console.error);
