function go(){
   //set font
   require("Font6x12").add(Graphics);
   require("GoodTime18x19").add(Graphics);
   g.setFontGoodTime18x19();
   //clear display 
   g.clear(); 
   g.setRotation(2);
   // write some text
   g.drawString("000",0,0);
   // write to the screen
   g.flip(); 
}
// SPI
SPI1.setup({mosi: D31,sck: D30});
var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});


var rdyPin;
var sdaPin;
var slcPin;
var i2c;
var i2cAddr = 0x44;
var doInitialSetup;
var irqHandleId;
var counter1 = 0;
var counter2 = 0;
var counter3 = 0;
var counter4 = 0;
var counter5 = 0;

function readEvents() {

   while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1 || buf[0] == 255 || buf[1] == 255) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,1);// touch
    while(digitalRead(rdyPin));
    buf3 = read(0x02,1); //coordinates
    console.log(buf, buf2, buf3);

    let td = buf2[0] & 0xE;

    if(buf[1] &  0x80) {
     counter1++;
    }
    else if(buf[1] &  0x40) {
        counter2++;
    }

 if(td & 8) {
       counter1 = counter2 = 0;
      digitalPulse(D25,1,100);
    }
    
   
    g.clear().drawString(counter1,0,0).drawString(counter2,0,70).flip();
    return true;
}
var currentState  = 0;
function handleInterrupt(e){
    poke32(0x40010600,0x6E524635);
    if(e.state) {
      return;
    }
    homePressed = false;
    if (doInitialSetup) {
		reInit();
		doInitialSetup = false;
		return;
	}
    if(!readEvents()){
        return;
    }
    if(showReset){
        doInitialSetup = true;
        //print('Show Reset Flag is ON.');
        return;
    }
}
function readRegisters(){
    while(digitalRead(rdyPin));
    console.log(read(0x01,1));
     while(digitalRead(rdyPin));
    console.log(read(0x09,5));
     while(digitalRead(rdyPin));
    console.log(read(0x0D,1));
     while(digitalRead(rdyPin));
    console.log(read(0x0A,8));
     while(digitalRead(rdyPin));
    console.log(read(0x0B,3));
     while(digitalRead(rdyPin));
    console.log(read(0x0C,3));
     while(digitalRead(rdyPin));
    console.log(read(0x09,1));
    
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
        write([0x09,0x00,0x55,0x00,0x00,0xc6]);
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
        
        resolve(true);
    });
    return promise;
}

function reInit(){
        var promise = new Promise(function(resolve, reject) {
        //read(0x00,2);// read device info
        write([0x01, 0x00]);  //set in projection mode**
        write([0x09,0x00,0x92,0x10,0x00,0x02]);
        write([0x0A,0xff,0xff,0xff,0xff,0xff,0x00,0x14,0x04]);
        write([0x0B,0x10,0x30,0x40]);
        write([0x09,0x10,0xd2,0x10,0x00,0x00]);

        resolve(true);
    });
    return promise;
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

function read(reg, len){
    i2c.writeTo({address:i2cAddr, stop:false}, reg);
    return i2c.readFrom(i2cAddr,len);
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
              },200);
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

    event_handshake();
   
    init_setup().then(()=>{
        
      //setInterval(function(){ poke32(0x40010600,0x6E524635);readEvents();},1);
    });

    showReset=false;
    doInitialSetup = true;
    currentState = 0;
    //setInterval(function(){console.log('');},1000);
}



function kill(){
    clearWatch(irqHandleId);
}

