#!/usr/bin/env node

/**
 * LIST ALL APPS SCRIPT PROJECTS AND THEIR FUNCTIONS
 * Find all tools/functions across all projects
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const KNOWN_PROJECTS = [
  { name: 'GPT Formatter', id: '1orJ__UUViG-gdSOHXt2VSGzo--ASib9XdVLVCApccKujWnqTuxq7wHIw' },
  { name: 'Advanced Cache System', id: '1FlAo4bVGhUQ-XnVaWiNNcWsq1RFyPVIGU6wETIWFm6i5K6y6YpJU7Xkn' },
  { name: 'Title Optimizer', id: '1NtPcMH5VnIaA7W3Ux3qLvXphF0zfvr0cUbMdQDdLqk9sYpf7o31Y7Y8f' }
];

console.log('\n🔍 ANALYZING ALL APPS SCRIPT PROJECTS FOR AVAILABLE TOOLS\n');
console.log('═══════════════════════════════════════════════════════════════\n');

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

async function analyzeProjects() {
  try {
    const auth = await authorize();
    const script = google.script({ version: 'v1', auth });

    const allTools = [];

    for (const project of KNOWN_PROJECTS) {
      console.log(`📦 ${project.name}\n`);

      try {
        const content = await script.projects.getContent({
          scriptId: project.id
        });

        const codeFile = content.data.files.find(f => f.name === 'Code');
        if (codeFile) {
          const code = codeFile.source;

          // Find all functions that start with run, open, show (typical UI entry points)
          const functionMatches = [...code.matchAll(/^function\s+(run|open|show)(\w+)/gm)];
          
          if (functionMatches.length > 0) {
            console.log(`   Available Functions:\n`);
            functionMatches.forEach(match => {
              const funcName = match[1] + match[2];
              console.log(`   - ${funcName}()`);
              allTools.push({
                project: project.name,
                function: funcName
              });
            });
          } else {
            console.log(`   No UI entry functions found\n`);
          }

          // Check for existing menu items
          const menuMatches = [...code.matchAll(/addItem\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g)];
          if (menuMatches.length > 0) {
            console.log(`\n   Current Menu Items:\n`);
            menuMatches.forEach(match => {
              console.log(`   - "${match[1]}" → ${match[2]}()`);
            });
          }

          console.log('\n');
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 ALL AVAILABLE TOOLS ACROSS PROJECTS:\n');
    
    const groupedByProject = {};
    allTools.forEach(tool => {
      if (!groupedByProject[tool.project]) {
        groupedByProject[tool.project] = [];
      }
      groupedByProject[tool.project].push(tool.function);
    });

    Object.keys(groupedByProject).forEach(projectName => {
      console.log(`   ${projectName}:`);
      groupedByProject[projectName].forEach(func => {
        console.log(`      - ${func}()`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

analyzeProjects();
