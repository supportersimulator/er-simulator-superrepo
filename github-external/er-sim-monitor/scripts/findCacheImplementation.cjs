#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const PRODUCTION_PROJECT_ID = '12NihbVaaAIyRMCtzZ-aGjJ71CdL-HDjhmjxiD_S_EgIOuDOtrUH6M1l2';

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

async function find() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const content = await script.projects.getContent({
      scriptId: PRODUCTION_PROJECT_ID
    });

    const code = content.data.files.find(f => f.name === 'Code').source;

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('FINDING CACHE IMPLEMENTATION');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Find where CACHED_MERGED_KEYS is used
    console.log('1. Where CACHED_MERGED_KEYS is SET:\n');
    const cacheKeySetMatches = code.matchAll(/setProp.*CACHED_MERGED_KEYS.*\)/g);
    for (const match of cacheKeySetMatches) {
      const idx = match.index;
      const context = code.substring(Math.max(0, idx - 200), idx + 400);
      console.log('Found at position ~' + code.substring(0, idx).split('\n').length + ':');
      console.log(context);
      console.log('\n---\n');
    }

    console.log('\n2. Where CACHED_MERGED_KEYS is READ:\n');
    const cacheKeyGetMatches = code.matchAll(/getProp.*CACHED_MERGED_KEYS.*\)/g);
    for (const match of cacheKeyGetMatches) {
      const idx = match.index;
      const context = code.substring(Math.max(0, idx - 200), idx + 200);
      console.log('Found at position ~' + code.substring(0, idx).split('\n').length + ':');
      console.log(context);
      console.log('\n---\n');
    }

    console.log('\n3. Functions that mention "Pathway_Analysis_Cache":\n');
    const pathwayMatches = code.matchAll(/function\s+(\w+)[^{]*\{[^}]*Pathway_Analysis_Cache[^}]*\}/gs);
    for (const match of pathwayMatches) {
      console.log('✅ ' + match[1] + '()');
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

find();
