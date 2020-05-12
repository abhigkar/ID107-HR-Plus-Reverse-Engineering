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

var irqHandleId;
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
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1 || buf[0] == 255 || buf[1] == 255) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,2);// touch
    while(digitalRead(rdyPin));
    buf3 = read(0x02,3); //coordinates

    let td = buf2[0] & 0xE;
  
  

    if(buf[1] &  0x80) { //fr
      //counter1++;
      self.emit('flick',{dir:'right'});
    }
    else if(buf[1] &  0x40) {//fl
       //counter2++;
       self.emit('flick',{dir:'left'});
    }
    if(td & 8) {
      //counter1 = counter2 = 0;
      self.emit('touch',{dir:'home'});
      digitalPulse(D25,1,100);
    }
    //g.clear().drawString(counter1,0,0).drawString(counter2,0,70).flip();
    return true;

}
function handleInterrupt(e){
    if(e.state)return;//IF ready pin is HIGH return
    if (doInitialSetup) {
		if(!init_setup()){
        }
		doInitialSetup = false;
		return;
	}
    if(!readEvents()){
        return;
    }

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
        irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'falling',debounce:0 });
    });
    showReset=false;
    doInitialSetup = true;
};

IQS263.prototype.kill = function() {
    clearWatch(irqHandleId);
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