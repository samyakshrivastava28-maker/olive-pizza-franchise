const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Olive Pizza — Franchise Management Terminal',
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false // Required for cross-origin Firebase auth popups
    }
  });

  // Strip Electron from User-Agent to prevent Google OAuth disallowed_useragent rejection
  const currentUserAgent = win.webContents.getUserAgent();
  win.webContents.setUserAgent(currentUserAgent.replace(/Electron\/[0-9\.]+\s/g, ''));

  // Handle popups: allow Google OAuth / Firebase auth popups inside Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    const isAuthUrl = 
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('google.com/o/oauth2') ||
      url.includes('apis.google.com');

    if (isAuthUrl) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
          }
        }
      };
    }
    return { action: 'deny' };
  });

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5175');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });