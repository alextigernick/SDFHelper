const request = require('request');
const cheerio = require('cheerio')
const fs      = require('fs');
module.exports = {
    scrape: scrape
 };
 //you'll never need this file unless theres a new sdf version.
function scrape() {
    request("http://sdformat.org/spec?ver=1.6&elem=world",buildRequests);
}
function parseElement(tag){
    var data = tag.Element.html();
    ret = {};
    ret.TagName = data.substring(data.indexOf("&lt;") + 4, data.indexOf("&gt;"));
    ret.Required = data.substring(data.indexOf("Required:"));
    ret.Required = ret.Required.substring(ret.Required.indexOf(">")+1,ret.Required.substring(ret.Required.indexOf(">")).indexOf("<")+ret.Required.indexOf(">"))
    
    ret.Type = data.substring(data.indexOf("Type:"));
    ret.Type = ret.Type.substring(ret.Type.indexOf(">")+1,ret.Type.substring(ret.Type.indexOf(">")).indexOf("<")+ret.Type.indexOf(">"))

    ret.Default = data.substring(data.indexOf("Default:"));
    ret.Default = ret.Default.substring(ret.Default.indexOf(">")+1,ret.Default.substring(ret.Default.indexOf(">")).indexOf("<")+ret.Default.indexOf(">"))

    ret.Description = data.substring(data.indexOf("Description:"));
    ret.Description = ret.Description.substring(ret.Description.indexOf(">")+1,ret.Description.substring(ret.Description.indexOf(">")).indexOf("<")+ret.Description.indexOf(">"))
    return ret;
}
function parseAttribute(i,tag){
    var data = baseList.find(tag).html();
    ret = {};
    ret.TagName = data.substring(data.indexOf("<h5>") + 4, data.indexOf("<small>"));
    ret.Required = data.substring(data.indexOf("Required:"));
    ret.Required = ret.Required.substring(ret.Required.indexOf(">")+1,ret.Required.substring(ret.Required.indexOf(">")).indexOf("<")+ret.Required.indexOf(">"))
    
    ret.Type = data.substring(data.indexOf("Type:"));
    ret.Type = ret.Type.substring(ret.Type.indexOf(">")+1,ret.Type.substring(ret.Type.indexOf(">")).indexOf("<")+ret.Type.indexOf(">"))

    ret.Default = data.substring(data.indexOf("Default:"));
    ret.Default = ret.Default.substring(ret.Default.indexOf(">")+1,ret.Default.substring(ret.Default.indexOf(">")).indexOf("<")+ret.Default.indexOf(">"))

    ret.Description = data.substring(data.indexOf("Description:"));
    ret.Description = ret.Description.substring(ret.Description.indexOf(">")+1,ret.Description.substring(ret.Description.indexOf(">")).indexOf("<")+ret.Description.indexOf(">"))
    return ret;
}
let baseList;
let fullArray = {};
let requestList = [];
function buildRequests(err,response,body){
    var doc = cheerio.load(body);
    fullArray = {};
    var tabs = [];
    var vers = [];
    var temp = doc('ul[id=tabs]').children("li").children('a').toArray();
    temp.forEach(function(tab){
        tabs.push({
            name:tab.firstChild.data,
            link:tab.attribs['href']
        });
    });
    temp = doc('select[id=version]').children("option").toArray();
    temp.forEach(function(ver){
        vers.push({
            name:ver.firstChild.data,
            version:ver.attribs['value']
        });
        fullArray[ver.attribs['value']] = [];
    });
    for(tab in tabs){
        for(version in vers){
            ver = tabs[tab].link.substring(tabs[tab].link.indexOf("ver=")+4,tabs[tab].link.substring(tabs[tab].link.indexOf("ver=")).indexOf("&")+tabs[tab].link.indexOf("ver="));
            requestList.push(tabs[tab].link.replace(ver,vers[version].version));
        }
    }
    request("http://sdformat.org/".concat(requestList.pop()),buildJson);
}
function buildJson(error,response,body){
    var ver = response.request.path;
    ver = ver.substring(ver.indexOf("ver=")+4,ver.substring(ver.indexOf("ver=")).indexOf("&")+ver.indexOf("ver="));
    if (typeof(fullArray[ver]) == "undefined"){
        fullArray[ver] = [];
    }
    var doc = cheerio.load(body);
    console.log("parsing: "+response.request.path)
    var tree = {};
    baseList = doc('div[class="tree well"]').children('ul');
    var peruse = function(i,e){
        var ret = {};
        var elem = baseList.find(e);
        var next = baseList.find(e.parent.nextSibling).children("li").children('a')
        ret.Elsewhere  = baseList.find(e.parent.previousSibling).html().includes("chevron");
        ret.Attributes = next.children("span[class=tree-attribute]");
        ret.Subs       = next.children("span[class=tree-element]").map(peruse).get();
        ret.Element = elem;
        ret.Parsed = parseElement(ret);
        ret.ParsedAttributes = ret.Attributes.map(parseAttribute).get();
        var t = {Parsed:ret.Parsed,ParsedAttributes:ret.ParsedAttributes,Subs:ret.Subs,Elsewhere:ret.Elsewhere}
        return t;
    }
    tree.Notes = baseList.children('p').html();//
    var base = baseList.children('li').children('a').children("span[class=tree-element]");
    var w = base.map(peruse).get();
    fullArray[ver].push(w[0]);

    if(requestList.length != 0){
        request("http://sdformat.org/".concat(requestList.pop()),buildJson);
    }
    else{
        done();
    }
}
function done(){
    console.log(fullArray);
    fs.writeFile("output.json", JSON.stringify(fullArray), function(err) {
        if(err) {
            return console.log(err);
        }
    
        console.log("The file was saved!");
    });

}