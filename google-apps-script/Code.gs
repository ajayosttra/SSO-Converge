/**
 * OSTTRA SSO Central - Google Apps Script Web App Entrypoint
 * 
 * Auto-generated bundle from the SSO Central React Codebase.
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('OSTTRA SSO Central Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Returns the active Google user's email if available within the Osttra workspace
 */
function getActiveUserEmail() {
  try {
    return Session.getActiveUser().getEmail() || 'user@osttra.com';
  } catch (err) {
    return 'user@osttra.com';
  }
}
