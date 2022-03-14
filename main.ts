// Modules to control application life and create native browser window
import {app, BrowserWindow, ipcMain, dialog, screen} from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import JSZip from 'jszip'
let mainWindow : BrowserWindow

const args = process.argv.slice(1)
const serveParam = args.find(arg => arg.startsWith('--serve='))

function createWindow () {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
  width: Math.round(size.width * 0.66),
  height: Math.round(size.height * 0.66),
  webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration : true,
     // experimentalFeatures: true,
     allowRunningInsecureContent: false, //serveParam ? true : false,
     // enableRemoteModule : true,
     contextIsolation : false
    }
  })

  // and load the index.html of the app.
  if (serveParam) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    mainWindow.loadURL( serveParam.split('=')[1] )// "http://localhost:3041/#" )
  }
  else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
} // createWindow

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('opendialog', async (event, opendialogOptions) => {
  if (!fs.existsSync(opendialogOptions.defaultPath || __dirname))
    opendialogOptions.defaultPath = __dirname
  return await dialog.showOpenDialog(mainWindow, opendialogOptions)
})

ipcMain.handle('fs-stat', async (event, pathLike) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<fs.Stats>( (resolve, reject) => {
    fs.stat( pathLike, (err, stats) => {
      if (err)
        reject(err)
      else
        resolve(stats)
    })
  })
})
ipcMain.handle('fs-exist', async (event, pathLike) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<boolean>( (resolve, reject) => {
    fs.stat( pathLike, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT')
          resolve(false)
        else
          reject(err)
      }
      else
        resolve(true)
    })
  })
})
/**
 *
 */
ipcMain.handle('fs-write', async (event, pathLike, data, zip64?) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<boolean>( (resolve, reject) => {
    if (zip64){
      var zip = new JSZip()
      zip.loadAsync(data, {base64 : true, createFolders : true})
      .then( jsZip => jsZip.generateAsync( {type : 'nodebuffer', streamFiles : true})
                      .then( buffer => fs.writeFile( pathLike, buffer, (err) => {if (err) reject(err); else resolve(true)}))
                      .catch(error => reject(error)))
      .catch(error => reject(error))
    }
    else
      fs.writeFile( pathLike, data, (err) => {if (err) reject(err); else resolve(true)})
  })
})

ipcMain.handle('fs-read', async (event, pathLike, zip64?) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<string>( (resolve, reject) => {
    fs.readFile ( pathLike, (err, data) => {
      if (err)
        reject(err)
      else {
        if (zip64){
          var zip = new JSZip()
          zip.loadAsync(data, {base64 : false, createFolders : true})
          .then( jsZip => jsZip.generateAsync( {type : 'base64', streamFiles : true})
                          .then( base64 => resolve(base64))
                          .catch(error => reject(error)))
          .catch(error => reject(error))
        }
        else {
          resolve(data.toString('utf8'))
        }
      }
    })
  })
})

ipcMain.handle('fs-rename', async (event, pathLike, newFilename?) => {
  if (Array.isArray(pathLike))
  pathLike = path.join(...pathLike)
  return await new Promise<boolean>( (resolve, reject) => {
    fs.rename(pathLike, newFilename, (err)=> { if (err) reject(err); else resolve(true)})
  })
})

ipcMain.handle('fs-copy', async (event, pathLike, newFilename?) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<boolean|string>( (resolve, reject) => {
    fs.copyFile(pathLike, newFilename, (err)=> { if (err) reject(err); else resolve(true)})
  })
})

ipcMain.handle('fs-dir', async (event, command, pathLike, options) => {
  if (Array.isArray(pathLike))
    pathLike = path.join(...pathLike)
  return await new Promise<boolean|string[]|fs.Dirent[]>( (resolve, reject) => {
    switch(command){
      case 'mk'   : fs.mkdir(pathLike, options?options : { recursive : true }, (err) => {if (err) reject(err); else resolve(true)}); break
      case 'rm'   : fs.rmdir(pathLike, (err) => {if (err) reject(err); else resolve(true)}); break
      case 'list' : fs.readdir(pathLike, { withFileTypes : true}, (err, dirent) => { if (err) reject(err); else resolve(dirent)}); break
      case 'ren'  : fs.rename(pathLike, options, (err)=> { if (err) reject(err); else resolve(true)})
      case 'empty': fs.stat
      default : reject(`fs-dir: Unknown command ${command}`)
    }
  })
})
