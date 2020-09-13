var s = require("Storage");
const lcd = require("oled");

var spi = new SPI();
spi.setup({mosi: D31,sck: D30});
const g = lcd({spi:spi,csPin: D19, dcPin: D22,rstPin: D20, pwrPin: D26});


var img_world =eval(s.read("world.icon"));

g.clear();
g.drawString("Scroll test",5,5);
g.drawImage(img_world,0,80);
g.flip();
//g.setClipRect(0,90,63,125);
//scroll();

function scroll(){
   let counter = 1;
  let interval = setTimeout(()=>{
    if(counter >5) clearInterval(interval);
     g.scroll(40).flipPage(10,15);
    counter++;
  },100);
}

function scroll1(){
  g.drawString("Scroll test",5,5);
  g.drawImage(img_world,0,80);
  g.flip();
  setTimeout(()=>{
     for(let i=0;i<2;i++){
      g.scroll(50).flipPage(10,15);
   }
  },1000);
}

function scroll2(){
  g.drawString("Scroll test",5,5);
  g.drawImage(img_world,0,80);
  g.flip();
  setTimeout(()=>{
     for(let i=0;i<2;i++){
      g.scroll(0,-30).flip();
   }
  },1000);
}