const {ipcRenderer} = require('electron');
let ruleset;

undoQueue = {
            };
redoQueue = {
            };
openDocs = [];
activeDoc = "";
ipcRenderer.on('fileOpenData', fileOpenData);
ipcRenderer.on('new', fileNew);
ipcRenderer.on('save', fileSave);
ipcRenderer.on('fileClose', fileClose);

ipcRenderer.on('nextTab', nextTab);
ipcRenderer.on('prevTab', prevTab);

ipcRenderer.on('getRulesData', getRulesData);
ipcRenderer.on('undo', undo);
ipcRenderer.on('redo', redo);

ipcRenderer.send('getRules');
function getRulesData(event,data) {
  ruleset = data; 
}

function nextTab(){
  openTab(document.getElementById(openDocs[(openDocs.indexOf(activeDoc)+1)%openDocs.length]));
  
}
function prevTab(){
  var dex = (openDocs.indexOf(activeDoc)-1);
  if(dex < 0){
    dex+=openDocs.length;
  }
  openTab(document.getElementById(openDocs[dex]));
}

function openTab(obj){
  var roots = document.getElementsByClassName("root")
  for (var i = 0; i < roots.length; i++) {
    roots[i].style.display="none";
  } 
  document.getElementById(obj.id + "-view").style.display="block";
  activeDoc = obj.id;
  document.getElementById("title").innerHTML = obj.id+" - SDFhelper"
  var tabs = document.getElementById("tabList").children;
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].style.backgroundColor="#384E77";
  }
  
  obj.style.backgroundColor="#0D0630";
}

function removeTab(obj){
  var doc = obj.parentElement.id;
  obj.parentElement.remove();
  delete undoQueue[doc];
  document.getElementById(doc+"-view").remove();
  if (doc === activeDoc){
    var dex = openDocs.indexOf(doc);
    if(dex == 0){
      if(openDocs.length > 1){
        openDocs.splice(0,1);
        activeDoc = openDocs[0];
        openTab(document.getElementById(activeDoc));
      }
      else{
        openDocs.splice(0,1);
        fileNew();
      }
    }
    else{
      openDocs.splice(dex,1);
      activeDoc = openDocs[dex-1];
      openTab(document.getElementById(activeDoc));
    }
  }
}

function fileOpenData(event,data) {
  temp = data["filename"].split("/");
  tabGroup.addTab({
    title: temp[temp.length-1],
    src: "home.html",
    visible: true
  });
}
function fileNew(){
  console.log("new file");
  var num = 0;
  for(var i = 0; i < openDocs.length; i++){
    var rets = openDocs[i].split("/");
    if(rets[rets.length-1].startsWith("Untitled-")){
      num = Math.max(num,parseInt(rets[rets.length-1].replace("Untitled-","")));
    }
  }
  num++;
  var tablist = document.getElementById("tabList");
  var viewlist = document.getElementById("viewList");
  var tab = document.createElement("li");
  tab.innerHTML = '<li id="Untitled-'+num+'" onclick="event.stopPropagation();openTab(this)"><p>Untitled-'+num+'</p><element class="closeTab" onclick="event.stopPropagation();removeTab(this)">✖</element></li>';
  tablist.appendChild(tab.firstChild);
  openDocs.push("Untitled-"+num);
  var view = document.createElement("li");
  view.innerHTML = '<div class="root"id="'+("Untitled-"+num+"-view")+'"><div class="element"><div class="cont"><p class="title">sdf</p><element class="delete" onclick="remove(this)">✖ </element><br><element class="arrow" onclick="openlist(this)">➤</element><element class="add">🞧</element></div><ul class="elementlist"></ul></div></div>'
  viewlist.appendChild(view.firstChild);
  activeDoc = "Untitled-"+num;
  undoQueue[activeDoc] = [];
  redoQueue[activeDoc] = [];
  openTab(document.getElementById(activeDoc));

}
function fileSave(){
}
function fileClose(){
  removeTab(document.getElementById(activeDoc).firstChild);
}
function openlist(obj){
                
  var el = obj.parentElement.parentElement.getElementsByClassName("elementlist")[0];
  if (el.style.display === "none") {
      el.style.display = "block";
      obj.style.transform = "rotate(90deg)"
  } else {
      el.style.display = "none";
      obj.style.transform = "rotate(0deg)"
  }
  
}
function remove(obj){
  undoQueue[activeDoc].push({
      type:"delete",
      parent: obj.parentElement.parentElement.parentNode,
      next:obj.parentElement.parentElement.nextSibling,
      element: obj.parentElement.parentElement
  })
  obj.parentElement.parentElement.remove()
}
function redo(){
  if(redoQueue[activeDoc].size){
    order = redoQueue[activeDoc].pop();
  } 
}
function undo(){
  if(undoQueue[activeDoc].length){
    order = undoQueue[activeDoc].pop();
    redoQueue[activeDoc].push(order);
    switch (order.type){
      case "delete":
        order.parent.insertBefore(order.element,order.next);
        break;
    }
  } 
}
