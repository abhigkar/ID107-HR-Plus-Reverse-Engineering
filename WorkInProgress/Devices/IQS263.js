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
var homePressed;
var homeTimeout;
function IQS263(options,r,w) {
    this.r = r;
    this.w = w;
}
function readEvents(){
    while(digitalRead(rdyPin)); // detect comm window
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1) return false; // no data return
    while(digitalRead(rdyPin));// detect comm window
    buf2 = read(0x03,2);// touch 
    event.touchData.d1 = buf2[0];event.touchData.d2 = buf2[1];
    while(digitalRead(rdyPin));// detect comm window
    buf3 = read(0x02,3); //coordinates
    (buf[0] &0x80) ? (showReset = true) : (showReset = false);

    let td = buf2[0] & 0xE;
    if((td<< 0x1E) < 0 ) IQS263.emit('touch',{chn:1});
    if((td<< 0x1D) < 0 ) IQS263.emit('touch',{chn:2});
    if((td<< 0x1C) < 0 ) {//home touch
      homePressed = true;
      IQS263.emit('touch',{chn:3});
      homeTimeout = setTimeout(()=>{
        if(homePressed) homePressed = false;
        homeTimeout = 0;
        IQS263.emit('longhome',null);
      },5000);
    }
  else{
    homePressed = false;
    clearTimeout(homeTimeout);
    homeTimeout=0;
    
  }
    if(buf[1] &  0x80)  IQS263.emit('flick',{dir:'left'});
    if(buf[1] &  0x40)  IQS263.emit('flick',{dir:'right'});
    return true;
} 
function handleInterrupt(e){
    poke32(0x40010600,0x6E524635);//POKE watchdog only for ID107 HR Plus
    if(e.state)return;//IF ready pin is HIGH return
    homePressed = false;
    if (doInitialSetup) {
		if(!init_setup()){
        }
		doInitialSetup = false;
		return;
	}
    if(!readEvents()){
        return;
    }
    if(showReset){
        //doInitialSetup = true;
        //print('Show Reset Flag is ON.');
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
        write([0x09,0x00,0x15,0x00,0x00,0xc6]);
        write([0x0D,0x0f]);
        write([0x0A,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);
        write([0x0B,0x02,0x40,0x80]);
        write([0x0C,0x0A,0x14,0x38]);
        write([0x09,0x10]);
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
            console.log("Timed out");
        }
        resolve(true);
    }
);
return promise;
}
IQS263.prototype.init = function() {
    event_handshake();
    init_setup().then(()=>{
        irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'both',debounce:0 });
    });
    showReset=false;
    doInitialSetup = true;
    setInterval(function(){poke32(0x40010600,0x6E524635);},100);//POKE watchdog only for ID107 HR Plus
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
    }, function(reg, data) { // write
        i2c.writeTo(i2cAddr, data);
    }));
};