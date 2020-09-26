/*
This work partial. After putting in sleep/reInit the setWatch does not work. 
The sequence is still not clear but works some time with "SOME" sequence.
forceCommunication() works but seems while(digitalRead(rdyPin));  is always "1"/true and this is not required at all 
when in sleep mode

*/

const lcd = require("oled");
var spi = new SPI();
spi.setup({mosi: D31,sck: D30});

const g = lcd({spi:spi, csPin: D19, dcPin: D22, rstPin: D20, pwrPin: D26});


var rdyPin;
var sdaPin;
var slcPin;
var i2c;
var i2cAddr = 0x44;
var doInitialSetup;
var irqHandleId;

var evt;
var nextEvtTO;
var longTapTO;
function readEvents() {
    //while(digitalRead(rdyPin));
    buf = read(0x01,2,false);// events
    if(buf[1] ==0 || buf[1] ==1 || buf[0] == 255 || buf[1] == 255) return false;
    if( buf[0] & 0x80){
      doInitialSetup = true;
    }
    //while(digitalRead(rdyPin));
    buf2 = read(0x03,1,false);// touch
    //while(digitalRead(rdyPin));
    buf3 = read(0x02,1,true); //coordinates
    if(nextEvtTO>0){
      clearTimeout(nextEvtTO);
      nextEvtTO = 0;
    }
    if(longTapTO>0){
      clearTimeout(longTapTO);
      longTapTO = 0;
    }
    console.log(buf, buf2, buf3);
    g.setFont8x12();
    g.clear();
    if(buf[1] &  0x80) {
      g.drawString("Flick : Left", 5,10);
    }
    else if(buf[1] &  0x40) {
       g.drawString("Flick : Right",5,10);
    }
    else if(buf[1] &  0x20) { //TAP
       if(evt){
         switch(evt.touch){
            case 2:
              g.drawString("TAP: D "+evt.slide,5,10);
              break;
            case 4:
              g.drawString("TAP: U "+evt.slide,5,10);
              break;
            case 6:
              g.drawString("TAP: M "+evt.slide,5,10);
              break;
            case 8:
              g.drawString("TAP: H",5,10);
              break;
         }
       }
    }
    else{
      evt = {sys:buf[1],touch:buf2[0] & 0x0E,slide:buf3[0]};
      if(evt.touch == 8){
        longTapTO = setTimeout(()=>{
          console.log("LONG HOME");
        },2000);
      }
      else{
         nextEvtTO = setTimeout(()=>{
         if(evt.touch != 0){
            console.log("OK");
         }
         else{
         }
        
      },10);
      }
     
    }
    g.flip();
    return true;
}
var currentState  = 0;
function handleInterrupt(e){
    poke32(0x40010600,0x6E524635);
    if(e.state) {
      return;
    }
    if(!readEvents()){
        return;
    }
    if (doInitialSetup) {
        console.log("re Int");
		init();
		doInitialSetup = false;
		return;
	}
}
function readRegisters(){
    while(digitalRead(rdyPin));
    console.log(read(0x01,2,true));
     while(digitalRead(rdyPin));
    console.log(read(0x09,5,true));
     while(digitalRead(rdyPin));
    console.log(read(0x0D,1,true));
     while(digitalRead(rdyPin));
    console.log(read(0x0A,8,true));
     while(digitalRead(rdyPin));
    console.log(read(0x0B,3,true));
     while(digitalRead(rdyPin));
    console.log(read(0x0C,3,true));
     while(digitalRead(rdyPin));
    console.log(read(0x09,1,true));
    
  }
function touchEvent(){}
function slideEvent(){}
function proxEvent(){}
function movementEvent(){}
function tapEvent(){}
function flickRight(){}
function flickLeft(){}

function init_setup(){
        var promise = new Promise(function(resolve, reject) {
        read(0x00,2);// read device info
        write([0x01, 0x00]);  //set in projection mode**
        write([0x09,0x00,0x15,0x00,0x00,0xc6]);//ProxSettings
        write([0x0D,0x0f]);//Active Channels
        write([0x0A,0x10,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);//Thresholds
        write([0x0B,0x02,0x40,0x80]);//Timings & Targets
        write([0x0C,0x0A,0xA0,0x20]);//Gesture Timers
        write([0x09,0x10]);//REDO ATI
       
        var timeoutCount=10;
        var buff;
        do {
            while(digitalRead(rdyPin));
            buff = read(0x09,1);
        }
        while ((buff[0] & 0b00000100) && (timeoutCount-- > 0) );

        if (buff[0] & 0b00000100)
        {
            print("Timed out");
        }
         write([0x09,0x00,0x55,0x00,0x00,0xc6]);
        resolve(true);
    });
    return promise;
}

function reInit(){
         while(digitalRead(rdyPin));write([0x01, 0x00]);  //set in projection mode**
         while(digitalRead(rdyPin));write([0x09,0x00,0x92,0x10,0x00,0x02]);
         while(digitalRead(rdyPin));write([0x0A,0xff,0xff,0xff,0xff,0xff,0x00,0x14,0x04]);
         while(digitalRead(rdyPin));write([0x0B,0x10,0x30,0x40]);
         while(digitalRead(rdyPin));write([0x09,0x10,0xd2,0x10,0x00,0x00]);
}

function resetAll(){
        var promise = new Promise(function(resolve, reject) {
        //read(0x00,2);// read device info
        write([0x01, 0x00]);
        write([0x07, 0x00,0x00,0x00,0x00,0x00]);
        write([0x08, 0x00,0x00,0x00,0x00]);
        write([0x09, 0x00,0x00,0x00,0x00,0x00]);
        write([0x0A,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]);
        write([0x0B,0x00,0x00,0x00]);
        write([0x0C,0x00,0x00,0x00]);
        write([0x0D,0x00]);
        resolve(true);
    });
    return promise;
}

function read(reg, len,stop){
    i2c.writeTo({address:i2cAddr, stop:false}, reg);
    if(stop)
      return i2c.readFrom(i2cAddr,len);
    else
       return i2c.readFrom({address:i2cAddr, stop:false},len);
}
function write(val){
    i2c.writeTo(i2cAddr, val);
}
function event_handshake(){ //iqs263_event_mode_handshake
    forceCommunication().then(()=>{
            write([0x09, 0x00, (0x15|0x40)]);
            print('handshak done');
        });
}

function forceCommunication(){
    var promise = new Promise(function(resolve, reject) {
        rdyPin.mode("output");
        digitalWrite(rdyPin,0);
        setTimeout(()=>{
            rdyPin.mode("input");
            setTimeout(function() {
                resolve('done!');
              },10);
        },10);
    });
    return promise;
}

function setup(){ //iqs263_sar_probe
    rdyPin = new Pin(17);
    sdaPin = D16;
    slcPin = D15;
    i2c = new I2C();

    rdyPin.mode("input");
    i2c.setup({scl:slcPin,sda:sdaPin,bitrate: 400000});

    //event_handshake();
   
     //init_setup().then(()=>{
        //irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'falling',debounce:2 });
      //setInterval(function(){readEvents();},1);
    // });

    showReset=false;
    doInitialSetup = false;
    currentState = 0;
    //setInterval(function(){poke32(0x40010600,0x6E524635);},1000);
}



function kill(){
    clearWatch(irqHandleId);
}

function redoATI(){
 while(digitalRead(rdyPin));  write([0x09,0x10]);//REDO ATI
}

 function init(){
  while(digitalRead(rdyPin));write([0x01, 0x00]);  //set in projection mode**
        while(digitalRead(rdyPin));write([0x09,0x00,0x15,0x00,0x00,0xc6]);//ProxSettings
        while(digitalRead(rdyPin));write([0x0D,0x0f]);//Active Channels
       while(digitalRead(rdyPin)); write([0x0A,0x10,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);//Thresholds
       while(digitalRead(rdyPin)); write([0x0B,0x02,0x40,0x80]);//Timings & Targets
    while(digitalRead(rdyPin)); write([0x0C,0x0A,0xA0,0x20]);//Gesture Timers//Gesture Timers
      while(digitalRead(rdyPin));  write([0x09,0x10]);//REDO ATI
     
        var timeoutCount=10;
        var buff;
        do {
            while(digitalRead(rdyPin));
            buff = read(0x09,1);
        }
        while ((buff[0] & 0b00000100) && (timeoutCount-- > 0) );

        if (buff[0] & 0b00000100)
        {
            print("Timed out");
        }
    while(digitalRead(rdyPin));  write([0x09,0x00,0x55,0x00,0x00,0xc6]);
 }
/*
setTimeout(()=>{
while(digitalRead(rdyPin));
write([0x09,0x00,0x15]);
},1000);


let count = 5;
rdyPin.mode("output");
digitalWrite(rdyPin,0);
print(digitalRead(rdyPin));
while(digitalRead(rdyPin) && --count);
print(digitalRead(rdyPin));
if(count <=0) print("TO");
rdyPin.mode("input");
//init();

write([0x01, 0x00]);  //set in projection mode**
write([0x09,0x00,0x15,0x00,0x00,0xc6]);//ProxSettings
write([0x0D,0x0f]);//Active Channels
write([0x0A,0x10,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);//Thresholds
write([0x0B,0x02,0x40,0x80]);//Timings & Targets
write([0x0C,0x0A,0xA0,0x20]);//Gesture Timers
write([0x09,0x10]);//REDO ATI
write([0x09,0x00,0x55,0x00,0x00,0xc6]);


let count = 5;
rdyPin.mode("output");
digitalWrite(rdyPin,0);
print(digitalRead(rdyPin));
while(digitalRead(rdyPin) && --count);
print(digitalRead(rdyPin));
if(count <=0) print("TO");
rdyPin.mode("input");

var countWatch=0;
var initWatch = setWatch(function(e) { 
  // watchdog to prevent runaway
  if( countWatch >= 3 ) clearWatch(initWatch);
  print(e);
  countWatch++;
  }, D17, { repeat:true, edge:'both',data:D17  }
);
forceCommunication().then(()=>{print(read(0,2));})
forceCommunication().then(()=>{
 write([0x09,0x00,0x15]);
});

setTimeout(()=>{
//clearWatch();
//digitalWrite(rdyPin,0);
print(read(0x01,1));
},1000);



poke32(0x50000700+15*4,2)
poke32(0x50000700+16*4,2)
poke32(0x50000700+17*4,2)


poke32(0x5000073C,2)
poke32(0x50000740,2)
poke32(0x50000744,2)
*/