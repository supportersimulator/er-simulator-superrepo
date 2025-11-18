const fs = require('fs');
const { google } = require('googleapis');

(async () => {
  const creds = JSON.parse(fs.readFileSync('config/credentials.json', 'utf8'));
  const token = JSON.parse(fs.readFileSync('config/token.json', 'utf8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  auth.setCredentials(token);
  const script = google.script({ version: 'v1', auth });
  const content = await script.projects.getContent({ 
    scriptId: '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2' 
  });
  const code = content.data.files.find(f => f.name === 'Code').source;
  
  const showFieldIdx = code.indexOf('function showFieldSelector() {');
  const saveFieldIdx = code.indexOf('function saveFieldSelectionAndStartCache(', showFieldIdx);
  const modalCode = code.substring(showFieldIdx, saveFieldIdx);
  
  console.log('✅ FINAL DEPLOYMENT VERIFICATION:\n');
  console.log('1. Live Log panel?', modalCode.includes('<div id="log"') || modalCode.includes('logPanel'));
  console.log('2. No categories?', !modalCode.includes('grouped') && !modalCode.includes('category-title'));
  console.log('3. 3-section layout?', modalCode.includes('DEFAULT') && modalCode.includes('RECOMMENDED') && modalCode.includes('OTHER'));
  console.log('4. Uses getFieldSelectorRoughDraft?', modalCode.includes('getFieldSelectorRoughDraft'));
  console.log('5. Calls getRecommendedFields async?', modalCode.includes('getRecommendedFields'));
  console.log('6. Has AI double-checkmark logic?', modalCode.includes('aiAgreedFields') && modalCode.includes('✓✓'));
  console.log('\n✅ Ready to test! Refresh Google Sheet (F5) and click cache button.');
})();
