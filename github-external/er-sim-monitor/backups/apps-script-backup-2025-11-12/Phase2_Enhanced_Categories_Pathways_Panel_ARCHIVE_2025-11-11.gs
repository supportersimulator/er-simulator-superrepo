/**
 * PHASE 2: ENHANCED CATEGORIES & PATHWAYS PANEL (WITH AI CATEGORIZATION)
 *
 * Updated to include AI Auto-Categorization review interface
 */

/**
 * Open Categories & Pathways Panel (with AI Discovery tab + AI Categorization)
 */
function openCategoriesPathwaysPanel() {
  const ui = getSafeUi_();
  if (!ui) return;

  const html = buildCategoriesPathwaysMainMenu_();
  ui.showSidebar(HtmlService.createHtmlOutput(html).setTitle('📂 Categories & Pathways').setWidth(400));
}

/**
 * Build main menu with tabbed interface (including AI categorization)
 */
/**
 * buildCategoriesPathwaysMainMenu_() REMOVED FROM ARCHIVE
 *
 * This function was removed to prevent conflicts with the active version
 * in Phase2_Enhanced_Categories_With_AI.gs
 *
 * Original function archived: 2025-11-11
 * Removed to fix: Apps Script calling old buggy version alphabetically first
 *
 * If you need to restore this, it's in the Google Drive backup.
 */


/**
 * Open Category Mappings Editor (NEW)
 * Allows user to edit symptom/system definitions
 */
function openCategoryMappingsEditor() {
  const ui = getSafeUi_();
  if (!ui) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');

  if (!mappingSheet) {
    ui.alert('Error', 'Mapping sheet not found: accronym_symptom_system_mapping', ui.ButtonSet.OK);
    return;
  }

  // Get current mappings
  const data = mappingSheet.getDataRange().getValues();
  const headers = data[0];

  let mappingRows = '';
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    mappingRows += `
      <tr>
        <td><input type="text" value="${row[0]}" data-col="0" data-row="${i}" /></td>
        <td><input type="text" value="${row[1]}" data-col="1" data-row="${i}" /></td>
        <td><input type="text" value="${row[2]}" data-col="2" data-row="${i}" /></td>
        <td><input type="text" value="${row[3]}" data-col="3" data-row="${i}" /></td>
        <td><button onclick="deleteRow(${i})">🗑️</button></td>
      </tr>
    `;
  }

  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #2c3e50; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; border: 1px solid #dfe3e8; text-align: left; }
        th { background: #2a3040; color: #e7eaf0; }
        input { width: 100%; padding: 6px; border: 1px solid #d1d7de; border-radius: 3px; }
        button { padding: 8px 16px; background: #3b7ddd; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2d6bc6; }
        .btn-danger { background: #dc3545; }
        .btn-danger:hover { background: #c82333; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
      </style>
    </head>
    <body>
      <h2>⚙️ Edit Category Mappings</h2>
      <p>Manage symptom accronyms and system categories used for AI categorization.</p>

      <table id="mappings-table">
        <thead>
          <tr>
            <th>Accronym</th>
            <th>Symptom (Pre-Category)</th>
            <th>System (Post-Category)</th>
            <th>Alt System</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${mappingRows}
        </tbody>
      </table>

      <button onclick="addNewRow()" style="margin-top: 16px;">➕ Add New Mapping</button>
      <button onclick="saveMappings()" class="btn-success" style="margin-top: 16px;">💾 Save All Changes</button>

      <script>
        function addNewRow() {
          const tbody = document.querySelector('#mappings-table tbody');
          const rowCount = tbody.querySelectorAll('tr').length + 1;

          const newRow = document.createElement('tr');
          newRow.innerHTML = \`
            <td><input type="text" value="" data-col="0" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="1" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="2" data-row="\${rowCount}" /></td>
            <td><input type="text" value="" data-col="3" data-row="\${rowCount}" /></td>
            <td><button onclick="deleteRow(\${rowCount})">🗑️</button></td>
          \`;
          tbody.appendChild(newRow);
        }

        function deleteRow(rowNum) {
          if (confirm('Delete this mapping?')) {
            const row = document.querySelector(\`input[data-row="\${rowNum}"]\`).closest('tr');
            row.remove();
          }
        }

        function saveMappings() {
          const rows = [];
          const tbody = document.querySelector('#mappings-table tbody');

          tbody.querySelectorAll('tr').forEach(tr => {
            const inputs = tr.querySelectorAll('input');
            rows.push([
              inputs[0].value,
              inputs[1].value,
              inputs[2].value,
              inputs[3].value
            ]);
          });

          google.script.run
            .withSuccessHandler(() => {
              alert('✅ Mappings saved successfully!');
              google.script.host.close();
            })
            .withFailureHandler(err => alert('❌ Error: ' + err.message))
            .saveCategoryMappings(rows);
        }
      </script>
    </body>
    </html>
  `).setWidth(800).setHeight(600);

  ui.showModalDialog(html, '⚙️ Category Mappings Editor');
}

/**
 * Save category mappings back to sheet
 */
function saveCategoryMappings(rows) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappingSheet = ss.getSheetByName('accronym_symptom_system_mapping');

  if (!mappingSheet) {
    throw new Error('Mapping sheet not found');
  }

  // Clear existing data (except headers)
  const lastRow = mappingSheet.getLastRow();
  if (lastRow > 1) {
    mappingSheet.getRange(2, 1, lastRow - 1, 4).clear();
  }

  // Write new data
  if (rows.length > 0) {
    mappingSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }

  Logger.log('✅ Saved ' + rows.length + ' category mappings');
}
