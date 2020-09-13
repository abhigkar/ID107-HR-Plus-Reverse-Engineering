const showInfo = ()=>{
    var s = require("Storage");
    var watch = eval(s.read("watch.icon"));
    g.clear();
    g.drawImage(watch,10,10);
    g.drawString("ID107HRPlus",2,83);
    g.drawString("Espruino",10,95);
    g.drawString(process.env.VERSION,10,110);
    g.flip();
    delete watch;
};
function init(){
    const info = {
        showInfo: showInfo,
    };
    return info;
}

module.exports = init;
