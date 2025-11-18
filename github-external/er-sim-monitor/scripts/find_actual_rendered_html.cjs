#!/usr/bin/env node

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function findActualRenderedHTML() {
  try {
    console.log('🔍 FINDING ACTUAL HTML BEING RENDERED\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const credPath = path.join(__dirname, '../config/credentials.json');
    const tokenPath = path.join(__dirname, '../config/token.json');

    const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);

    const script = google.script({ version: 'v1', auth: oAuth2Client });
    const scriptId = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

    const content = await script.projects.getContent({ scriptId });
    const codeFile = content.data.files.find(f => f.name === 'Code');

    // Search for the actual tab content builder for Discovery
    console.log('🔍 Looking for tab content builders:\n');

    // The Discovery tab content is built by buildAIDiscoveryTabHTML_
    // But let me check if there's a DIFFERENT function being called

    // Find where discoveryTabHTML is set
    const discoveryTabHTMLIdx = codeFile.source.indexOf('const discoveryTabHTML = buildAIDiscoveryTabHTML_()');
    
    if (discoveryTabHTMLIdx !== -1) {
      console.log('✅ Found: const discoveryTabHTML = buildAIDiscoveryTabHTML_()\n');
      
      // Now find WHERE this is being used
      const usageIdx = codeFile.source.indexOf("' + discoveryTabHTML +", discoveryTabHTMLIdx);
      if (usageIdx !== -1) {
        console.log('✅ discoveryTabHTML is being concatenated into output\n');
      }
    }

    // Let me check the STYLES in buildAIDiscoveryTabHTML_ - maybe the CSS is missing
    const funcStart = codeFile.source.indexOf('function buildAIDiscoveryTabHTML_() {');
    const funcEnd = codeFile.source.indexOf('\n}\n', funcStart) + 3;
    const funcCode = codeFile.source.substring(funcStart, funcEnd);

    // Check if this function includes CSS styles
    const hasStyles = funcCode.includes('.btn-discover') || funcCode.includes('style');
    console.log(`buildAIDiscoveryTabHTML_ includes styles: ${hasStyles}\n`);

    if (!hasStyles) {
      console.log('⚠️  WARNING: buildAIDiscoveryTabHTML_() has NO STYLES!\n');
      console.log('   The original version had inline <style> tags\n');
      console.log('   Current version only returns basic HTML\n');
    }

    // Check what the ORIGINAL Phase2_Modal_Integration has
    console.log('\n📄 Checking original Phase2_Modal_Integration.gs:\n');
    
    const modalFile = content.data.files.find(f => f.name === 'Phase2_Modal_Integration');
    if (modalFile) {
      const originalFunc = modalFile.source.substring(
        modalFile.source.indexOf('function buildAIDiscoveryTabHTML_'),
        modalFile.source.indexOf('\n}\n', modalFile.source.indexOf('function buildAIDiscoveryTabHTML_')) + 3
      );
      
      console.log(`   Original function size: ${originalFunc.length} characters`);
      console.log(`   Code.gs function size: ${funcCode.length} characters\n`);
      
      if (originalFunc.length > funcCode.length * 2) {
        console.log('⚠️  WARNING: Original function is MUCH larger!\n');
        console.log('   Original probably has all the styles and complete HTML\n');
        console.log('   Code.gs version is simplified (missing styles)\n');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

findActualRenderedHTML();
