const pinMonitor = (mode) => {
  const regs = [
    2, 3, 4, 5, 6, 9,
    10, 11, 12, 13, 15, 18, 19,
    21, 23, 24, 25, 26, 27, 28, 29,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47
  ];

  let pr = {};
  regs.forEach(r => {
    Pin(r).mode(mode);
  });

  setInterval(() => {
    regs.forEach(r => {
      const val = digitalRead(r);
      if (val != pr[r]) {
        console.log(r, val);
        pr[r] = val;
      }
    });
  }, 100);
};

const scanI2C = (sda, scl) => {
  I2C1.setup({ sda: sda, scl: scl });
  for (let reg = 8; reg < 127; reg++) {
    try {
      I2C1.writeTo(reg, 0);
      I2C1.readFrom(reg, 1).forEach(val => {
        console.log('found i2c on scl', scl, 'sda', sda, 'reg', Number(reg).toString(16), 'reg0', val);
      });
    } catch (e) {
    }
  }
  Pin(scl).mode('input');
  Pin(sda).mode('input');
};

const pinScan = () => {
  const regs = [
    2, 3, 4, 5, 6, 9,
    10, 11, 12, 13, 15, 18, 19,
    21, 23, 24, 25, 26, 27, 28, 29,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47
  ];
  let a = 0;
  let b = 0;
  const int = setInterval(() => {
    if (a >= b) { console.log('.', b); b++; a = 0; };
    if (b >= regs.length) { console.log('done'); clearInterval(int); return };

    if (a != b && a != undefined && b != undefined) {
      scanI2C(regs[a], regs[b]);
      scanI2C(regs[b], regs[a]);
    }
    a++;
  }, 500);
}

const pinScan2 = (sda) => {
  const regs = [
    2, 3, 4, 5, 6, 9,
    10, 11, 12, 13, 15, 18, 19,
    21, 23, 24, 25, 26, 27, 28, 29,
    31, 32, 33, 34, 35, 36, 37, 38, 39,
    40, 41, 42, 43, 44, 45, 46, 47
  ];
  const i = setInterval(() => {
    if (regs.length === 0) { console.log('done'); clearInterval(i); return; }
    const b = regs.shift();
    scanI2C(sda, b);
  }, 500);
}


function watchFun(e){print(e.state);}
setWatch(watchFun, D17, {repeat: true, edge: 'falling' });


var countWatch=0;
var initWatch = setWatch(function(e) { 
  // watchdog to prevent runaway
  if( countWatch >= 3 ) clearWatch(initWatch);
print(e);
  countWatch++;
  }, D17, { repeat:true, edge:'falling',data:D17  }
);

var img = {
  width : 42, height : 32, bpp : 1,
  buffer : require("heatshrink").decompress(atob("AB8B/0H/AEB//n/+AgH/AAPwgF/AgP+gEfBQWAh4PDgYEC/gZD/8An4EC4AUPFIkHAgXgHwokCDIIPCIYIPDAgIfCLAIvC4AKBLIIjBgA/BEYIaCAgcfO4IABgYtBAAU+AgcGS5g"))
};
var x,y;
function go(){
 //clear display 
   g.clear();
   x = g.getWidth()/2-21;
   y = g.getHeight()/2-16;
   g.setRotation(2);
   // write some text
   g.drawImage(img,x,y);
   // write to the screen
   g.flip(); 
}
// SPI
SPI1.setup({mosi: D31,sck: D30});
var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/OLED/ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});

let sz = 1;

setInterval(()=>{
  sz = (sz==1)?1.1:1;
 g.clear();
   // write some text
   g.drawImage(img,x,y, {scale:sz});
   // write to the screen
   g.flip(); 
},200);



var prevRead = analogRead(D29);
var intVal = setInterval(()=>{
    let read = analogRead(D29);
    console.log('diff ',(prevRead -read),'current read ', read);
    prevRead = read;
},2000);