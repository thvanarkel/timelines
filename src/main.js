const path = require('path')
const { app, ipcMain } = require('electron');

const Window = require('./classes/Window')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let dataWindow;

const createMainWindow = () => {
  // Create the browser window.
  mainWindow = new Window({
    file: path.join(__dirname, 'renderer', 'timeline.html')
  });
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

const createDataWindow = () => {
  // Create the browser window.
  dataWindow = new Window({
    file: path.join(__dirname, 'renderer', 'data.html'),
    width: 400,
    height: 800
  });

  // Emitted when the window is closed.
  dataWindow.on('closed', () => {
    dataWindow = null;
  });
};

function main () {
  createMainWindow();
  createDataWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', main);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
