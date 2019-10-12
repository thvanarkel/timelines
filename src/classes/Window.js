'use strict'

const { BrowserWindow } = require('electron')

// default window settings
const defaultProps = {
  width: 1200,
  height: 800,
  titleBarStyle: 'hiddenInset',
  
  webPreferences: {
    nodeIntegration: true
  }
}

class Window extends BrowserWindow {
  constructor ({ file, ...windowSettings }) {
    // calls new BrowserWindow with these props
    super({ ...defaultProps, ...windowSettings })
    
    // load the html and open devtools 
    this.loadURL('file://' + file)
    // this.webContents.openDevTools()
    
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

module.exports = Window