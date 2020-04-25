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
    let timeout = 400;
    //while(digitalRead(rdyPin));
    while(digitalRead(rdyPin));
  
    buf = read(0x01,2);
   console.log(buf[1]);
   while(digitalRead(rdyPin));
    //while(digitalRead(rdyPin));
    buf = read(0x02,3);
    console.log(buf);
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
    }
    if(event.slide){
        console.log(event);
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
    write([0x01, 0x00]);  //set in projection mode
    write([0x0D,0x0f]);
    write([0x0A,0x10,0x20,0x20,0x20,0x03,0x00,0x14,0x04]); //set  touch and prox thresholds for each channel
    write([0x0B,0x00,0x30,0x40]);// Set the ATI Targets (Target Counts)
    write([0x07,0x08,0x08,0x08,0x08]);// Set the BASE value for each channel
    write([0x09,0x00,0x15,0x40,0x00,0xff]);// Setup prox settings
    write([0x08,0x51,0x49,0x4A,0x49]);// Setup Compensation (PCC)
    write([0x0C, 0x05,0xA0,0x20]); // Set gesture timers on IQS263
    write([0x09,0x10]);// Redo ati
    write([0x09,0x00,(0x15|0x40),(0x40|0x02),0x00,0xff]);// Setup prox settings (0x15|0x40) for evt mode
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
              });
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