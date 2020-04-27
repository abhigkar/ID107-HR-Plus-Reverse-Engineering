const atan = Math.atan;
const sqrt = Math.sqrt;
const pi = Math.PI;

let screenX = 2;
let screenY = 34;

var danger = require("heatshrink").decompress(atob("j0egMAj/AgEB+/ggEcgIHB4EBwECgEDgEYgEGgFAAoIaBgEggkAgWAikAhUAqEAvEB50dsEDvHzgEN8fsg8nx8zy+czneo0DgfL40cjkn7l54/B9EP+0B2EuFwPF2EAjMG4EI+UDwF+sEb+OH4Hj8V553hh8D8FonBOBMoIACA=="));



SPI1.setup({mosi: D31,sck: D30});

var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/OLED/ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});


var inRisk = false;

function showRisk(){
  if(inRisk){
    g.clear();
    g.drawImage(danger,0,screenY,{scale:2});
    digitalPulse(D25,1,100);
    g.flip();
    g.on();
  }
}

function removeRisk(){
  g.clear();
  g.drawImage(danger,screenX,screenY);
  g.flip();
  g.off();
}

function checkRisk(xyz){
  let x = xyz.x, y = xyz.y, z = xyz.z;
  var tilt = [(atan(x / sqrt(y*y + z*z))*180) / pi,
              (atan(y/ sqrt(x*x + z*z))*180) /pi ];
  if (tilt[0] < -30) {
    showRisk();
    inRisk = true;
  } else {
    inRisk = false;
    removeRisk();
  }
}

function go(){
   g.clear();
   g.setRotation(2);
   screenX = g.getWidth()/2;
   screenY = g.getHeight()/2-8;
   g.drawString("Starting..",screenX,screenY);
   g.flip();
   Id107hp.on('accel',checkRisk);
}



//Id107hp.removeAllListeners("accel");

//Id107hp.removeListener('accel',checkRisk);

 