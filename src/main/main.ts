import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { DtoSystemInfo } from '../ipc-dtos/dtosysteminfo';
import * as os from 'os';
import {  writeFile } from 'fs';
import {format} from 'url'
let win: BrowserWindow | null = null;

app.on('ready', createWindow);

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // Disabled Node integration
      nodeIntegration: false,
      // protect against prototype pollution
      contextIsolation: true,
      // turn off remote
      enableRemoteModule: true,
      // Preload script
      preload: path.join(app.getAppPath(), 'dist/preload', 'preload.js')
    }
  });

  // https://stackoverflow.com/a/58548866/600559
  Menu.setApplicationMenu(null);

  win.loadFile(path.join(app.getAppPath(), 'dist/renderer', 'index.html'));

  win.on('closed', () => {
    win = null;
  });
}
function printCurrentWindow(){
  const options = {
    silent: false,
    printBackground: true,
    color: false,
    margin: {
        marginType: 'printableArea'
    },
    landscape: false,
    pagesPerSheet: 1,
    collate: false,
    copies: 1,
    header: 'Header of the Page',
    footer: 'Footer of the Page'
  }
  win?.webContents.print(options,(success,errType)=>{
      if(!success) console.log(errType)
    })
}

function printCurrentWindowToPDF(){
  let previewWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload:path.join(app.getAppPath(),'dist/preload','preload.js')
    },
  })
  // previewWindow.previewFile(path,displayname)
  const pdfPath = path.join(os.homedir(),'Desktop','temp.pdf')
  win?.webContents.printToPDF({printBackground:true}).then(data=>{
    console.log(data);
    previewWindow.loadURL('data:application/pdf;base64,'+data.toString('base64'))
    previewWindow.once("ready-to-show", () => {
      previewWindow.show();
    });
    writeFile(pdfPath,data,(error)=>{
      if (error) throw error
      console.log("Successfull");        
    })
  }).catch(error=>{
    console.log('Failed ',error)
  })
}

function createPreviewWindowHTML(){
  // According to the documentation, this work only on macOS
  let previewWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload:path.join(app.getAppPath(),'dist/preload','preload.js')
    },
  })
  console.log(__dirname);
  
  previewWindow.loadURL(format({
    pathname: path.join(__dirname, 'Google search.html'),
    protocol: 'file:',
    slashes: true
  }))
  // previewWindow.loadFile('/mnt/old/FutureLabs/angular-electron-boilerplate/Google Search.html')
  previewWindow.once('ready-to-show',()=>{
    previewWindow.show()
  })
}
function createChildWindow(){
  const option1 = {
    landscape:false,
    displayHeaderFooter:false,
    printBackground:true,
    scale:1,
    pageSize:'letter',
    margins:{top:1,bottom:1,left:1,right:1},
    pageRanges:'',
    // headerTemplate:,
    // footerTemplate:,
    preferCSSPageSize:false
  }
  let childWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    modal: true,
    show: false,
  
    // Make sure to add webPreferences with below configuration
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload:path.join(app.getAppPath(),'dist/preload','preload.js')
    },
  });
  
  // Child window loads settings.html file
  childWindow.loadURL("https://feels.pdn.ac.lk");
  
  childWindow.once("ready-to-show", () => {
    childWindow.show();
  });
  childWindow.webContents.on('did-finish-load',()=>{

    const pdfPath = path.join(os.homedir(),'Desktop','temp.pdf')
    console.log(pdfPath)
    childWindow.webContents.print({},(success,errType)=>{
      if(!success) console.log(errType)
    })
    childWindow.webContents.printToPDF({printBackground:true}).then(data=>{
      writeFile(pdfPath,data,(error)=>{
        if (error) throw error
        console.log("Successfull");        
      })
    }).catch(error=>{
      console.log('Failed ',error)
    })
  })
  childWindow.on('closed', () => {
    win = null;
  });

}


ipcMain.on('dev-tools', () => {
  if (win) {
    win.webContents.toggleDevTools();
  }
});
ipcMain.on("create-child-window", (event, arg) => {
  printCurrentWindowToPDF()
  // createPreviewWindowHTML()
  // createChildWindow();
  // win?.webContents.on('did-finish-load',()=>{
    // const pdfPath = path.join(os.homedir(),'Desktop','temp.pdf')
    // console.log(pdfPath)
    // win?.webContents.printToPDF({}).then(data=>{
    //   writeFile(pdfPath,data,(error)=>{
    //     if (error) throw error
    //     console.log("Successfull");        
    //   })
    // }).catch(error=>{
    //   console.log('Failed ',error)
    // })
    // })
  })

ipcMain.on('request-systeminfo', () => {
  const systemInfo = new DtoSystemInfo();
  systemInfo.Arch = os.arch();
  systemInfo.Hostname = os.hostname();
  systemInfo.Platform = os.platform();
  systemInfo.Release = os.release();
  const serializedString = systemInfo.serialize();
  if (win) {
    win.webContents.send('systeminfo', serializedString);
  }
});
