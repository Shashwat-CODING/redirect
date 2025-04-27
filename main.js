const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fetch = require('node-fetch');
const url = require('url');

// Your backend server code
const REFERER_YOUTUBE = 'https://www.youtube.com/';
const USER_AGENT_ANDROID = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Mobile Safari/537.36';

class InnerTube {
  constructor(options = {}) {
    this.baseUrl = 'https://youtubei.googleapis.com/youtubei/v1/';
    this.context = {
      clientName: 'ANDROID',
      clientVersion: '19.17.34',
      clientId: 3,
      userAgent: USER_AGENT_ANDROID,
      referer: REFERER_YOUTUBE,
      ...options
    };
  }

  getHeaders() {
    return {
      'X-Goog-Api-Format-Version': '1',
      'X-YouTube-Client-Name': this.context.clientId.toString(),
      'X-YouTube-Client-Version': this.context.clientVersion,
      'User-Agent': this.context.userAgent || USER_AGENT_ANDROID,
      'Referer': this.context.referer || REFERER_YOUTUBE,
      'Content-Type': 'application/json'
    };
  }

  getContextPayload() {
    return {
      context: {
        client: {
          clientName: this.context.clientName,
          clientVersion: this.context.clientVersion
        }
      }
    };
  }

  async makeRequest(endpoint, payload) {
    try {
      const url = new URL(endpoint, this.baseUrl);
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    return new Error(`YouTube API Error: ${error.message}`);
  }

  async player(options) {
    const payload = {
      ...this.getContextPayload(),
      videoId: options.videoId
    };
    return this.makeRequest('player', payload);
  }
}

// Create the server
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  
  const { pathname, query } = url.parse(req.url, true);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname.startsWith('/streams/')) {
    const videoId = pathname.split('/streams/')[1];

    if (!videoId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Video ID is required' }));
      return;
    }

    try {
      const yt = new InnerTube();
      const playerInfo = await yt.player({ videoId });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(playerInfo));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Start the backend server
  server.listen(9999, () => {
    console.log('Backend server running at http://localhost:3000');
  });

  // Load the frontend URL
  mainWindow.loadURL('https://ytify-native.netlify.app/');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
