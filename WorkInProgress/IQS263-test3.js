//https://github.com/andrewloomis/glassesDevices/blob/c0574d8e9b5a35d1312190713ef876fee2cae84d/src/touchslider.cpp

var rdyPin = new Pin(17);
var sdaPin = D16;
var slcPin = D15;

var i2cAddr = 0x44;
var deviceInfo = 0x00;

var SYSFLAGS0 = 0x01;
var PROXSETTTINGS = 0x09;

function read(reg, len){
    i2c.writeTo({address:i2cAddr, stop:false}, reg);
    return i2c.readFrom(i2cAddr,len);
}

function write(val){
    i2c.writeTo(i2cAddr,val);
}

function forceCommunication(){
    var promise = new Promise(function(resolve, reject) {
        setTimeout(()=>{
            rdyPin.mode("output");
            digitalWrite(rdyPin,0);
            setTimeout(function() {
                resolve('done!');
              });
        },10);    
    });
    return promise;
}

function eventTriggred(){
    forceCommunication().then(function(done) {
        var data = read(SYSFLAGS0, 2);
            console.log(data[1]);
        //setTimeout(()=>{
          //watchId = setWatch(eventTriggred, rdyPin, {repeat: false, edge: 'falling',debounce:0 });
       // },500);
        
    });
    
}
function setProjectionMode(){
    i2c.writeTo(i2cAddr, [SYSFLAGS0,0x00]);
}

function writeProxySettings(){
   i2c.writeTo(i2cAddr, [PROXSETTTINGS,0x00, 0xDC, 0x00, 0x00]);
}

function lowPowerMode(){
    forceCommunication().then(function(done) {
        console.log(done); // --> 'done!'
      });;
}

function setActiveChannel(){
    let ACTIVE_CHANNELS = 0x0D;
    let ACTIVE_CHS = 0x0F; //0x07
    i2c.writeTo(i2cAddr, [ACTIVE_CHANNELS,ACTIVE_CHS]);
}
function setProxThresholds(){
    let THRESHOLDS = 0x0A;

    let PROX_THRESHOLD = 0x08; //0x10
    let TOUCH_THRESHOLD_CH1 = 0x20;
    let TOUCH_THRESHOLD_CH2 = 0x20;
    let TOUCH_THRESHOLD_CH3 = 0x20;
    let MOVEMENT_THRESHOLD = 0x03;
    let RESEED_BLOCK = 0x00;
    let HALT_TIME = 0x14;
    let I2C_TIMEOUT = 0x04;
    i2c.writeTo(i2cAddr, [THRESHOLDS,PROX_THRESHOLD, TOUCH_THRESHOLD_CH1, TOUCH_THRESHOLD_CH2,
        TOUCH_THRESHOLD_CH3, MOVEMENT_THRESHOLD, RESEED_BLOCK, HALT_TIME,  I2C_TIMEOUT ]);
}

function setATITargets(){
    let ATI_TARGET_TOUCH = 0x30;
    let ATI_TARGET_PROX = 0x40;
    let TIMINGS_AND_TARGETS = 0x0B;
    i2c.writeTo(i2cAddr, [TIMINGS_AND_TARGETS,ATI_TARGET_TOUCH, ATI_TARGET_PROX ]);
}

function MultiChanalBaseValue(){
    let MULTIPLIERS = 0x07;
    let MULTIPLIERS_CH0	= 0x08;//0x19 - default
    let MULTIPLIERS_CH1 = 0x08;//0x08 - default
    let MULTIPLIERS_CH2 = 0x08;//0x08 - default
    let MULTIPLIERS_CH3 = 0x08;//0x08 - default
    let BASE_VAL = 0x08;//0x44 - default

    i2c.writeTo(i2cAddr, [MULTIPLIERS,
        MULTIPLIERS_CH0,
        MULTIPLIERS_CH1,
        MULTIPLIERS_CH2,
        MULTIPLIERS_CH3]);
 
}
function SetupCompensation(){
    let COMPENSATION = 0x08;

    let COMPENSATION_CH0 = 0x51;
    let COMPENSATION_CH1 = 0x49;
    let COMPENSATION_CH2 = 0x4A;
    let COMPENSATION_CH3 = 0x49;
    i2c.writeTo(i2cAddr, [COMPENSATION,
        COMPENSATION_CH0,
        COMPENSATION_CH1,
        COMPENSATION_CH2,
        COMPENSATION_CH3]);
}
function SetTimings(){
    let LOW_POWER = 0x00;
    let TIMINGS_AND_TARGETS = 0x0B;
    i2c.writeTo(i2cAddr, [TIMINGS_AND_TARGETS,LOW_POWER]);
}
function SetGestureTimers(){
    let GESTURE_TIMERS = 0x0C;
    let TAP_TIMER = 0x05;
    let FLICK_TIMER = 0x51;
    let FLICK_THRESHOLD = 0x33;
    i2c.writeTo(i2cAddr, [GESTURE_TIMERS,TAP_TIMER, FLICK_TIMER, FLICK_THRESHOLD]);
}

var watchId;
function init(){
    rdyPin.mode("input");
    watchId = setWatch(eventTriggred, rdyPin, {repeat: false, edge: 'falling',debounce:0 });
    setProjectionMode();
    writeProxySettings();
    setActiveChannel();
    setProxThresholds();
    setATITargets();
    MultiChanalBaseValue();
    SetupCompensation();
    SetTimings();
}

 var i2c = new I2C();
forceCommunication().then(function(done) {
    init();
  });

