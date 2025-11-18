function addAILog(message) {
  try {
    const props = PropertiesService.getDocumentProperties();
    const existingLogs = props.getProperty('Sidebar_Logs') || '';
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
    const newLog = '[' + timestamp + '] ' + message;
    props.setProperty('Sidebar_Logs', existingLogs + newLog + '\n');
    Logger.log(newLog);  // Also log to execution log
  } catch (err) {
    Logger.log('Error writing to sidebar log: ' + err.message);
  }
}

function getSidebarLogs() {
  try {
    const logs = PropertiesService.getDocumentProperties().getProperty('Sidebar_Logs') || '';
    return logs;
  } catch (err) {
    return 'Error retrieving logs: ' + err;
  }
}

function clearSidebarLogs() {
  try {
    PropertiesService.getDocumentProperties().deleteProperty('Sidebar_Logs');
    return '🧹 Logs cleared.';
  } catch (err) {
    return 'Error clearing logs: ' + err;
  }
}

function appendLog(t){ const ta=document.getElementById('log'); ta.value += t + "\\n"; ta.scrollTop = ta.scrollHeight; }