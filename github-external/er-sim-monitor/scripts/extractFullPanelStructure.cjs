/**
 * Extract Full Panel Structure
 *
 * Show ALL sections and ALL buttons in Phase2_Enhanced_Categories_With_AI
 */

const { google } = require('googleapis');
require('dotenv').config();
const fs = require('fs');

async function main() {
  console.log('🔍 Extracting Full Panel Structure\n');
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

  const project = await script.projects.getContent({ scriptId });
  const panelFile = project.data.files.find(f => f.name === 'Phase2_Enhanced_Categories_With_AI');

  if (!panelFile) {
    console.log('❌ Panel file not found\n');
    return;
  }

  const html = panelFile.source;

  console.log('📄 File: Phase2_Enhanced_Categories_With_AI.gs\n');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Extract ALL sections (h3, h4)
  console.log('📑 ALL SECTIONS:\n');

  const sections = [];

  // Find h3 headers
  const h3Regex = /<h3[^>]*>([^<]*)<\/h3>/g;
  let match;

  while ((match = h3Regex.exec(html)) !== null) {
    sections.push({ level: 3, text: match[1].trim(), pos: match.index });
  }

  // Find h4 headers
  const h4Regex = /<h4[^>]*>([^<]*)<\/h4>/g;
  while ((match = h4Regex.exec(html)) !== null) {
    sections.push({ level: 4, text: match[1].trim(), pos: match.index });
  }

  // Sort by position
  sections.sort((a, b) => a.pos - b.pos);

  sections.forEach((section, i) => {
    const indent = section.level === 3 ? '' : '  ';
    console.log(`${indent}${i + 1}. ${section.text}`);
  });

  console.log('\n══════════════════════════════════════════════════════════════\n');

  // Extract ALL buttons with their section
  console.log('🔘 ALL BUTTONS (with section context):\n');

  const buttonRegex = /<button[^>]*>([^<]+)<\/button>/g;
  let btnMatch;
  let btnNum = 1;

  while ((btnMatch = buttonRegex.exec(html)) !== null) {
    const buttonText = btnMatch[1].trim();
    const buttonPos = btnMatch.index;

    // Find which section this button belongs to
    let currentSection = 'Unknown';
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].pos < buttonPos) {
        currentSection = sections[i].text;
        break;
      }
    }

    console.log(`${btnNum}. "${buttonText}"`);
    console.log(`   Section: ${currentSection}`);

    // Extract onclick
    const buttonContext = html.substring(btnMatch.index - 200, btnMatch.index + 200);
    const onclickMatch = buttonContext.match(/onclick=["']([^"']*)["']/);
    if (onclickMatch) {
      console.log(`   onclick: ${onclickMatch[1]}`);
    }
    console.log('');

    btnNum++;
  }

  console.log('══════════════════════════════════════════════════════════════\n');

  // Check if Apply and Export buttons exist
  console.log('🔍 Specific Button Search:\n');

  const applyMatch = html.match(/Apply[^<]*Master/i);
  const exportMatch = html.match(/Export[^<]*CSV/i);

  console.log(`  Apply to Master: ${applyMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
  if (applyMatch) {
    console.log(`    Text: "${applyMatch[0].substring(0, 50)}..."`);
  }

  console.log(`  Export CSV: ${exportMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
  if (exportMatch) {
    console.log(`    Text: "${exportMatch[0].substring(0, 50)}..."`);
  }

  console.log('\n══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
