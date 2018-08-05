const {app, BrowserWindow, ipcMain, dialog, Menu, MenuItem} = require('electron');
const url  = require('url'  );
const path = require('path' );
const fs   = require('fs'   );
const parseXML = require('xml2js').parseString;

const menuTemplate = [
    {
        label: 'File',
        submenu: [
        {
            label: "New",
            accelerator: 'Control+N',
            click: fileNew
        },
        {
            label: "Open",
            accelerator: 'Control+O',
            click: fileOpen
        },
        {
            label: "Save",
            accelerator: 'Control+S',
            click: fileSave
        },
        {
            label: "Close File",
            accelerator: 'Control+W',
            click: fileClose
        }]
    },

    {
        label: 'Edit',
        submenu: [
        {
            label: "Undo",
            accelerator: "Control+Z",
            click: undo
        },
        {
            label: "Undo",
            accelerator: "Control+Shift+Z",
            click: redo
        },
        {
            type: 'separator'
        },
        {
            role: 'cut'
        },
        {
            role: 'copy'
        },
        {
            role: 'paste'
        }]
    },

    {
        label: 'View',
        submenu: [
        {
            role: 'reload'
        },
        {
            role: 'toggledevtools'
        },
        {
            type: 'separator'
        },
        {
            role: 'resetzoom'
        },
        {
            role: 'zoomin'
        },
        {
            role: 'zoomout'
        },
        {
            type: 'separator'
        },
        {
            role: 'togglefullscreen'
        }]
    },

    {
        role: 'window',
        submenu: [
        {
            role: 'minimize'
        },
        {
            label: "Next Tab",
            accelerator: "Control+Tab",
            click: nextTab
        },
        {
            label: "Previous Tab",
            accelerator: "Control+Shift+Tab",
            click: prevTab
        }]
    },
    {
        role: 'help',
        submenu: [
        {
            label: 'Learn More'
        }]
    }
]


let win;

function createWindow() { 
   win = new BrowserWindow({width: 800, height: 600}) 
   win.loadURL(url.format ({ 
      pathname: path.join(__dirname, 'index.html'), 
      protocol: 'file:', 
      slashes: true 
   }))
   win.webContents.openDevTools()
  
   // Emitted when the window is closed.
   win.on('closed', () => {
     // Dereference the window object, usually you would store windows
     // in an array if your app supports multi windows, this is the time
     // when you should delete the corresponding element.
     win = null
   })
}
function fileOpen() {  
    dialog.showOpenDialog(
    function (fileNames) { 
        if(fileNames === undefined) { 
        console.log("No file selected"); 
        
        } 
        else { 
            for(file in fileNames){
                fs.readFile(fileNames[file], 'utf-8', (err, data) => { 
                    if(err){ 
                        alert("An error ocurred reading the file :" + err.message);
                        return; 
                    } 
                    // handle the file content 
                    parseXML(data,parseXML(data),
                        function (err, result) {
                            result["filename"] = fileNames[file];
                            win.send('fileOpenData', result); 
                        }
                    )
                    
                })
            }
        } 
    });
}
function fileNew(){
    win.send("new");
}
function fileSave(){
    win.send("save");
}
function fileClose(){
    win.send("fileClose");
}

function nextTab(){
    win.send("nextTab");
}
function prevTab(){
    win.send("prevTab");
}

function getRules(event,path) {
    event.sender.send('getRulesData', JSON.parse(fs.readFileSync('ruleset.json')))
}

function undo(){
    win.send("undo");
}
function redo(){
    win.send("redo");
}

ipcMain.on('getRules', getRules)  
ipcMain.on('fileOpen', fileOpen) 
const menu = Menu.buildFromTemplate(menuTemplate)
Menu.setApplicationMenu(menu)

app.on('ready', createWindow)
  
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})