const { app, BrowserWindow } = require('electron');
const path = require('path');

app.commandLine.appendSwitch('disable-gpu-sandbox');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Olive Pizza — Franchise Management Terminal',
    backgroundColor: '#020617',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false // Required for cross-origin Firebase auth popups and APIs
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // Strip Electron from User-Agent to prevent Google OAuth disallowed_useragent rejection
  const currentUserAgent = win.webContents.getUserAgent();
  win.webContents.setUserAgent(currentUserAgent.replace(/Electron\/[0-9\.]+\s/g, ''));

  // Network interceptors for Franchise backend communication
  const sess = win.webContents.session;
  const BACKEND_URL = 'https://olivepizza-owner.onrender.com';
  const PLATFORM_ORIGIN = 'https://franchise.olivepizza.in';

  sess.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    if (url.startsWith('file:///api/') || url === 'file:///api') {
      return callback({ redirectURL: url.replace('file:///api', `${BACKEND_URL}/api`) });
    }
    if (url.startsWith('file:///health') || url === 'file:///health') {
      return callback({ redirectURL: url.replace('file:///health', `${BACKEND_URL}/health`) });
    }
    callback({});
  });

  sess.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = { ...details.requestHeaders };
    if (!requestHeaders['Origin'] || requestHeaders['Origin'] === 'null' || requestHeaders['Origin'].startsWith('file://')) {
      requestHeaders['Origin'] = PLATFORM_ORIGIN;
    }
    callback({ cancel: false, requestHeaders });
  });

  sess.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    responseHeaders['access-control-allow-origin'] = ['*'];
    responseHeaders['access-control-allow-credentials'] = ['true'];
    responseHeaders['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, PATCH, OPTIONS'];
    responseHeaders['access-control-allow-headers'] = ['*'];
    callback({ cancel: false, responseHeaders });
  });

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
            sandbox: false,
            webSecurity: false
          }
        }
      };
    }
    return { action: 'deny' };
  });

  // F12 or Ctrl+Shift+I for DevTools
  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Franchise Desktop] Failed to load (${errorCode}: ${errorDescription}) at ${validatedURL}`);
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