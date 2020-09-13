const s = require("Storage");
//const img_bt = E.toArrayBuffer(atob("CxQBBgDgFgJgR4jZMawfAcA4D4NYybEYIwTAsBwDAA=="));
let g;

const onSecond =()=>{
  g.setFontGoodTime18x19();
  let dt = new Date();
  let mnt = dt.getMinutes() > 9 ? dt.getMinutes() : "0"+dt.getMinutes();
  let hrs = dt.getHours() > 12 ? dt.getHours() -12 : dt.getHours();
  let sec = dt.getSeconds();
  let del  = (sec%2) ? ":":" ";
  let hx = (hrs) > 9 ? 0:5;
  g.clearRect(0,40,63,58);
  g.drawString(hrs ,hx,40)
  .drawString(del,24,40)
  .drawString(mnt,28,40).flip();
  g.setFont8x12();
  g.clearRect(30,90,60,110).drawString(stepCounter,40,95)
  .flip();
};

const drawClock = ()=>{
  //var img_batt = require("heatshrink").decompress(atob("iEKwMA//+AIPAg38gYBFBIIPDA=="));
  //g.drawImage(img_batt,40,5);
  let dt = new Date();
  let dts = dt.toString().split(" ") ;
  //var img_world =eval(s.read("world.icon"));
  var img_steps =eval(s.read("steps.icon"));
  g.drawImage(img_steps,0,90);
  g.setFont8x12();
  g.drawString(dts[2]+" "+dts[1]+" ",5,65)
  .drawString(dts[0],40,25).drawString(stepCounter,40,95)
  .flip();
  
}

function init(lcd){
  g = lcd;
  onSecond();
  drawClock();
  const timerId = setInterval(()=>onSecond(),1000);
  const clockApp = {
    stop:()=>clearInterval(timerId),
  }
  return clockApp;
}

module.exports = init;

