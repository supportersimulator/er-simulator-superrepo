#!/usr/bin/env node

/**
 * Use Existing Deployment
 *
 * Updates .env with the existing deployment ID
 *
 * Usage:
 *   node scripts/useExistingDeployment.cjs
 */

const fs = require('fs');
const path = require('path');

const DEPLOYMENT_ID = 'AKfycbxr6bCFEGs-cYLuLtXPbxTGdI-p3fk6eC-HGIE8HzY';

console.log('');
console.log('📝 USING EXISTING DEPLOYMENT');
console.log('════════════════════════════════════════════════════');
console.log(`Deployment ID: ${DEPLOYMENT_ID}`);
console.log('════════════════════════════════════════════════════');
console.log('');

try {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Check if DEPLOYMENT_ID already exists
  if (envContent.includes('DEPLOYMENT_ID=')) {
    // Replace existing
    envContent = envContent.replace(
      /DEPLOYMENT_ID=.*/,
      `DEPLOYMENT_ID=${DEPLOYMENT_ID}`
    );
  } else {
    // Add new
    envContent += `\nDEPLOYMENT_ID=${DEPLOYMENT_ID}\n`;
  }

  fs.writeFileSync(envPath, envContent, 'utf8');

  console.log('✅ Updated .env with DEPLOYMENT_ID');
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('✅ READY FOR PROGRAMMATIC EXECUTION');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  console.log('Next step:');
  console.log('   Run batch processing on rows 2-3');
  console.log('   Command: npm run run-batch-direct "2,3"');
  console.log('');

} catch (error) {
  console.error('');
  console.error('❌ FAILED');
  console.error('════════════════════════════════════════════════════');
  console.error(`Error: ${error.message}`);
  console.error('');
  process.exit(1);
}
