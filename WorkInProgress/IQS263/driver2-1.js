//this code is somehow working and a previous version of driver2.js
function go(){
    //set font
    require("Font6x12").add(Graphics);
    g.setFont6x12();
    //clear display 
    g.clear();
    g.setRotation(2);
    // write some text
    g.drawString("Hello World",0,0);
    // write to the screen
    g.flip(); 
 }
 // SPI
 SPI1.setup({mosi: D31,sck: D30});
 var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/OLED/ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});
 
var pageCounter= 0;

var rdyPin;
var sdaPin;
var slcPin;
var i2c;
var i2cAddr = 0x44;
var doInitialSetup;
var irqHandleId;

var tempCount = 0;
var showReset;

var event = {
    prox:false,
    touch:false,
    tap:false,
    flickLeft:false,
    flickRight:false,
    slide:false
};


function handleInterrupt(){
    if (doInitialSetup) {
        //print('Perforning Initial setup');
		init_setup();
		doInitialSetup = false;
		return;
	}
    if(!readEvents()){
        //print('NO EVENT');
        return;
    }
    if(showReset){
        doInitialSetup = true;
        //print('Show Reset Flag is ON.');
        return;
    }
    if(event.flickLeft) 
    {   pageCounter++;
        if(pageCounter == 5) pageCounter = 1;
        g.clear();
        g.drawString("flickLeft",20,20);
        g.drawString(pageCounter,20,40);
        g.flip();
    }
    if(event.flickRight){
        pageCounter--;
        if(pageCounter == 1) pageCounter = 5;
        g.clear();
        g.drawString("flickRight",20,20);
        g.drawString(pageCounter,20,40);
        g.flip();
    }
}


function init_setup(){
    read(0x00,2);
    write([0x01, 0x00]);
    write([0x0D,0x07]);
    write([0x0A,0x10,0x20,0x20,0x20,0x03,0x00,0x14,0x04]);
    write([0x0B,0x00,0x30,0x40]);
    write([0x07,0x08,0x08,0x08,0x08]);
    write([0x09,0x00,0x15,0x40,0x00,0xff]);
    write([0x08,0x51,0x49,0x4A,0x49]);
    write([0x0C, 0x05,0xA0,0x20]);
    write([0x09,0x10]);
    write([0x09,0x00,(0x15|0x40),(0x40|0x02),0x00,0xff]);
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

function readEvents(){
    let timeout = 400;
    while(digitalRead(rdyPin) &&  --timeout);
    var buf = read(0x01,2);
    if(buf[0] == 0 && buf[1] == 0)
        return false;

    if(buf[0] &0x80){
        showReset = true;
    }
    else{
        showReset = false;
    }
    //print('event >> ',buf[1]);
    if(buf[1] & 0x01) event.prox = true; else  event.prox = false;
    if(buf[1] & 0x02) event.touch  = true; else  event.touch  = false;
    if(buf[1] & 0x20) event.tap  = true; else  event.tap = false;
    if(buf[1] & 0x40) event.flickLeft  = true; else  event.flickLeft  = false;
    if(buf[1] & 0x80) event.flickRight  = true; else  event.flickRight  = false;
    if(buf[1] & 0x04) event.slide  = true; else  event.slide  = false;

    return true;
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
    i2c.setup({scl:slcPin,sda:sdaPin});

    event_handshake();
    irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'falling',debounce:0 });

    showReset=false;

    doInitialSetup = true;
    print('IQR received ',irqHandleId);
}