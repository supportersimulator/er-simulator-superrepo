#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test the generated code to find syntax errors

const cachingFunctions = `    html += '';
    html += 'var cachingInProgress = false;';
    html += '';
    html += 'function startCaching() {';
    html += '  if (cachingInProgress) return;';
    html += '  cachingInProgress = true;';
    html += '  document.getElementById("cache-btn").disabled = true;';
    html += '  log("🚀 Starting batch cache...");';
    html += '  var selected = [];';
    html += '  for (var field in currentSelection) {';
    html += '    if (currentSelection[field]) selected.push(field);';
    html += '  }';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function() {';
    html += '      log("✅ Fields saved");';
    html += '      cacheNext25();';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .saveFieldSelection(selected);';
    html += '}';
    html += '';
    html += 'function cacheNext25() {';
    html += '  log("⏳ Caching next 25 rows...");';
    html += '  google.script.run';
    html += '    .withSuccessHandler(function(r) {';
    html += '      log("✅ Rows " + r.startRow + "-" + r.endRow + " cached (" + r.percentComplete + "%)");';
    html += '      if (r.complete) {';
    html += '        log("🎉 COMPLETE! " + r.totalRows + " rows cached");';
    html += '        cachingInProgress = false;';
    html += '        document.getElementById("cache-btn").textContent = "✅ Done!";';
    html += '        document.getElementById("cache-btn").style.background = "#0d652d";';
    html += '      } else {';
    html += '        setTimeout(cacheNext25, 1500);';
    html += '      }';
    html += '    })';
    html += '    .withFailureHandler(function(e) {';
    html += '      log("❌ " + e.message);';
    html += '      cachingInProgress = false;';
    html += '      document.getElementById("cache-btn").disabled = false;';
    html += '    })';
    html += '    .cacheNext25RowsWithFields();';
    html += '}';
    html += '';
`;

console.log('Generated caching functions:');
console.log(cachingFunctions);
console.log('\\nLength:', cachingFunctions.length);

fs.writeFileSync('/tmp/caching_functions_test.gs', cachingFunctions, 'utf8');
console.log('\\nSaved to /tmp/caching_functions_test.gs');
