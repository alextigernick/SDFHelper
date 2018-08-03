const {ipcRenderer} = require('electron');
const TabGroup = require("electron-tabs");
let ruleset;
let tabGroup = new TabGroup();
let homeTab = tabGroup.addTab({
  title: "Intro",   
  src: "home.html",
  visible: true
});
homeTab.activate();
ipcRenderer.on('fileOpenData', fileOpenData);
ipcRenderer.on('getRulesData', getRulesData);
ipcRenderer.send('getRules');
function getRulesData(event,data) {
  ruleset = data; 
}

function fileOpenData(event,data) {
  temp = data["filename"].split("/");
  tabGroup.addTab({
    title: temp[temp.length-1],
    src: "home.html",
    visible: true
  });
}

function openFile () {
    ipcRenderer.send('fileOpen', () => { 
        console.log("Open file event sent."); 
    }); 
}