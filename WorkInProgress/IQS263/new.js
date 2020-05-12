var rdyPin;
var sdaPin;
var slcPin;
var i2cAddr = 0x44;
var i2c;

function read(reg, len){
    i2c.writeTo({address:i2cAddr, stop:false}, reg);
    return i2c.readFrom(i2cAddr,len);
}

function write(val){
    i2c.writeTo(i2cAddr, val);
}

function init(){
    rdyPin = new Pin(17);
    sdaPin = D16;
    slcPin = D15;
    i2c = new I2C();
    rdyPin.mode("input");
    i2c.setup({scl:slcPin,sda:sdaPin});

    while(digitalRead(rdyPin));
    read(0x00,2);
    while(digitalRead(rdyPin));
    write([0x01, 0x00]);
    while(digitalRead(rdyPin));
    write([0x0D,0x07]);
    while(digitalRead(rdyPin));
    write([0x0A,0x10,0x20,0x20,0x20,0x03,0x00,0x14,0x04]);
    while(digitalRead(rdyPin));
    write([0x0B,0x00,0x30,0x40]);
    while(digitalRead(rdyPin));
    write([0x07,0x08,0x08,0x08,0x08]);
    while(digitalRead(rdyPin));
    write([0x09,0x00,0x15,0x40,0x00,0xff]);
    while(digitalRead(rdyPin));
    write([0x08,0x51,0x49,0x4A,0x49]);
    while(digitalRead(rdyPin));
    write([0x0C, 0x05,0xA0,0x20]);
    while(digitalRead(rdyPin));
    write([0x09,0x10]);
  
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
        return -1;
    }
  
    while(digitalRead(rdyPin));
    write([0x09,0x00,(0x15|0x40),(0x40|0x02),0x00,0xff]);
}

function readEvents(){
    poke32(0x40010600,0x6E524635);
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
     //if(buf[1] ==0 || buf[1] ==1 ) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,2);// touch 
    while(digitalRead(rdyPin));
    buf3 = read(0x02,3); //coordinates
    console.log(buf, buf2, buf3);
} 

var ts ;
var runts;
function startReading(){
    runts = setInterval(()=>{
        readEvents();
    },10);
    ts = setTimeout(()=>{
        clearInterval(runts);
    },20000);
}
/////////////////////////////////////////
var rdyPin;
var sdaPin;
var slcPin;
var i2c;
var i2cAddr = 0x44;
var doInitialSetup;
var irqHandleId;

var tempCount = 0;
var showReset;
var currentState;
var event = {
    prox:false,
    touch:false,
    tap:false,
    flickLeft:false,
    flickRight:false,
    slide:false,
    touchData:{
        d1:0x00,
        d2:0x00
    },
    cordData:{
        d1:0x00,
        d2:0x00,
        d3:0x00
    }
};

function readEvents(){
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1 ) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,2);// touch 
    while(digitalRead(rdyPin));
    buf3 = read(0x02,3); //coordinates
    console.log(buf, buf2, buf3);
  if(buf[0] &0x80){
        showReset = true;
    }
    else{
        showReset = false;
    }
  return true;
} 

function handleInterrupt(){
    poke32(0x40010600,0x6E524635);
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
        doInitialSetup = true;
        //print('Show Reset Flag is ON.');
        return;
    }
}

function touchEvent(){}
function slideEvent(){}
function proxEvent(){}
function movementEvent(){}
function tapEvent(){}
function flickRight(){}
function flickLeft(){}

function init_setup(){
    read(0x00,2);// read device info
    write([0x01, 0x00]);  //set in projection mode**
    write([0x09,0x00,0x15,0x00,0x00,0xc6]);
    write([0x0D,0x0f]);
    write([0x0A,0x10,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);
    write([0x0B,0x02,0x40,0x80]);
    write([0x0C,0x0A,0x14,0x38]);
    write([0x09,0x10]);
  /*
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
		return -1;
    }
    
  */
  
    write([0x09,0x00,0x55,0x00,0x00,0xc6]);
    return true;
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
    irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'both',debounce:0 });

    showReset=false;
    doInitialSetup = true;
    currentState = 0;
}

function kill(){
    clearWatch(irqHandleId);
}