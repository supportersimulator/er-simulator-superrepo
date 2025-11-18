#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

function getAccessToken() {
  const clasprcPath = path.join(process.env.HOME, '.clasprc.json');
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  return clasprc.tokens?.default?.access_token || clasprc.token?.access_token;
}

async function listProjects() {
  try {
    const accessToken = getAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const script = google.script({ version: 'v1', auth: oauth2Client });

    console.log('📋 Listing Apps Script projects...\n');
    
    const response = await script.projects.list({
      pageSize: 50
    });

    if (!response.data.projects || response.data.projects.length === 0) {
      console.log('No projects found');
      return;
    }

    response.data.projects.forEach(project => {
      console.log(`📁 ${project.title}`);
      console.log(`   ID: ${project.scriptId}`);
      console.log(`   URL: https://script.google.com/home/projects/${project.scriptId}/edit`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listProjects();
