/* Written by Abhinav Golwalkar */
/*This library is ported from Arduino library contributed by  @goran-mahovlic, @rogerclarkmelbourne, @curtpw*/
//Special thanks to atc1441.
/*Cradit:- 
Goran Mahovlic  https://github.com/goran-mahovlic/
Roger Clark     https://github.com/rogerclarkmelbourne/
Curt White      https://github.com/curtpw/
atc1441         https://github.com/atc1441
https://gitter.im/nRF51822-Arduino-Mbed-smart-watch/Lobby
*/
//Espruino code
//var i2c = new I2C();
//i2c.setup({ scl : D15, sda: D16 });
//var iqs263 = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/IQS263.js").connectI2C(i2c);
//iqs263.init();
/*
iqs263.on('longhome',()=>{console.log('home pressed for a long time');});
iqs263.on('slide',(data)=>{});
iqs263.on('touch',(data)=>{}); //data = chn => channel 1/2
iqs263.on('flick',(data)=>{});
*/

var intervalId;
var rdyPin;
var showReset;
var doInitialSetup;
var read, write;
var self;
function IQS263(options,r,w) {
    read = r;
    write = w;
    self = this;
}
function readEvents() {
    let evt = {leftFlick:false, rightFlick:false, channe1:false,channe2:false,channe3:false, touchArea:0, rawCord:0};
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1 || buf[0] == 255 || buf[1] == 255) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,1);// touch
    
    while(digitalRead(rdyPin));
    buf3 = read(0x02,1); //coordinates

    
    //if(buf2[1] ==0 || buf2[1] ==1) return; // ignore prox data
    console.log(buf, buf2, buf3);

    let td = buf2[0] & 0xE;

    if(buf[1] &  0x80) {
      evt.leftFlick = true;
    }
    else if(buf[1] &  0x40) {
       evt.rightFlick = true;
    }

    if(td & 2) {
         evt.channe2 =true;
    }
    else if(td & 4) {
         evt.channe1 =true;
    }
    else if(td & 8) {
       evt.channe3 =true;
    }
    evt.rawCord = buf3[0];
    if(buf3[0] >=0 && buf3[0] < 42){evt.touchArea = 1;}
    else if(buf3[0] >= 43 && buf3[0] < 84){evt.touchArea = 2;}
    else if(buf3[0] >=85 && buf3[0] < 256){evt.touchArea = 3;}

    return evt;

}
function event_handshake(){
    forceCommunication().then(()=>{
        write([0x09, 0x00, (0x15|0x40)]);
    });
}
function forceCommunication(){
    var promise = new Promise(function(resolve, reject) {
        rdyPin.mode("output");
        digitalWrite(rdyPin,0);
        setTimeout(()=>{
            rdyPin.mode("input");
            setTimeout(function() {
                resolve();
              });
        },10);
    });
    return promise;
}
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
        while ((buff[0] & 4) && (timeoutCount-- > 0) );

        if (buff[0] & 4)
        {
            print("Timed out");
        }
        
        resolve(true);
    });
    return promise;
}
IQS263.prototype.init = function() {
    
    event_handshake();
    init_setup().then(()=>{
        intervalId = setInterval(function(){ handleReadOp();},1);
    });
    showReset=false;
    doInitialSetup = true;
};

function handleReadOp(){
    let e = readEvents(); 
    if(e == undefined) return;
    self.onTouch(e)
}

IQS263.prototype.onTouch = function(event) {
       
};

IQS263.prototype.kill = function() {
    clearInterval(intervalId);
};

exports.IQS263 = IQS263;

exports.connectI2C = function(i2c, options) {
    var a = (options&&options.addr) || 0x44; //default address
    var rdy = (options&&options.rdy)||17;
    rdyPin = new Pin(rdy);
    rdyPin.mode("input");
    return (new IQS263(options, function(reg, len) { // read
        i2c.writeTo({address:a, stop:false}, reg);
        return i2c.readFrom(a,len);
    }, function(data) { // write
        i2c.writeTo(a, data);
    }));
};
