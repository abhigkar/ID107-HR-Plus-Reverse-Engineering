const i2cAddress = 0x44;
var i2c = null;
var rdyPin;
var dbg = true;
var sensorMode = 0;//0 for poll 1 for event
var intervalId = 0;
var prevEvt;
var cbHand;
var nextEvtTO;
const read = (reg,len)=>{
    i2c.writeTo({address:i2cAddress, stop:false}, reg);
    return i2c.readFrom(i2cAddress,len);
};
const write = (data)=> i2c.writeTo(i2cAddress, data);

const setDebugMode = (mode)=> dbg = mode;

const redoATI = ()=>{
    while(digitalRead(rdyPin));  
    write([0x09,0x10]);
}
const setSensorMode = (mode)=>{

};
const sleep = () => {
   
};

const wake = ()=>{
    
};

const getTimerId = ()=>{
    return intervalId;
};
const initSensor = ()=>{
    while(digitalRead(rdyPin)); write([0x01, 0x00]);  //set in projection mode**
    while(digitalRead(rdyPin)); write([0x09,0x00,0x15,0x00,0x00,0xc6]);//ProxSettings
    while(digitalRead(rdyPin)); write([0x0D,0x0f]);//Active Channels
    while(digitalRead(rdyPin)); write([0x0A,0x10,0x15,0x15,0x10,0x08,0x00,0x14,0x04]);//Thresholds
    while(digitalRead(rdyPin)); write([0x0B,0x02,0x40,0x80]);//Timings & Targets
    while(digitalRead(rdyPin)); write([0x0C,0x0A,0x14,0x38]);//Gesture Timers//Gesture Timers
    while(digitalRead(rdyPin)); write([0x09,0x10]);//REDO ATI
    var timeoutCount=10;
    var buff;
    do {
        while(digitalRead(rdyPin));
        buff = read(0x09,1);
    }
    while ((buff[0] & 0b00000100) && (timeoutCount-- > 0) );

    if (buff[0] & 0b00000100)
    {
       if(dbg) print("ATI Timed out");
    }
};

const dbgReadRegisters = ()=>{
    while(digitalRead(rdyPin)); console.log(read(0x01,2)); //System Flags
    while(digitalRead(rdyPin)); console.log(read(0x09,5)); //ProxSettings
    while(digitalRead(rdyPin)); console.log(read(0x0D,1)); //Active Channels
    while(digitalRead(rdyPin)); console.log(read(0x0A,8)); //Thresholds
    while(digitalRead(rdyPin)); console.log(read(0x0B,3)); //Timings & Targets
    while(digitalRead(rdyPin)); console.log(read(0x0C,3)); //Gesture Timers
};
const readEvents = ()=>{
    let eventData = {flick:'NONE',tap:'NONE',cords:0};
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1 || buf[0] == 255 || buf[1] == 255) {
        //check reset bit and ATI error here
        // buf[0] = 128 reset bit is on
        return false
    };
    while(digitalRead(rdyPin));
    buf2 = read(0x03,1);// touch
    while(digitalRead(rdyPin));
    buf3 = read(0x02,1); //coordinates
    if(nextEvtTO>0){
        clearTimeout(nextEvtTO);
        nextEvtTO = 0;
    }
    if(dbg) console.log(buf, buf2, buf3);
    if(buf[1] &  0x80) {
        eventData.flick = "LEFT";
    }
    else if(buf[1] &  0x40) {
        eventData.flick = "RIGHT";
    }
    else if(buf[1] &  0x20) { //TAP
       if(prevEvt){
         switch(prevEvt.touch){
            case 2:
                eventData.tap = "DOWN";
                eventData.cords = prevEvt.slide;
                break;
            case 4:
                eventData.tap = "UP";
                eventData.cords = prevEvt.slide;
                break;
            case 6:
                eventData.tap = "MIDDLE";
                eventData.cords = prevEvt.slide;
                break;
            case 8:
                eventData.tap = "HOME";
              break;
         }
       }
    }
    else{
        prevEvt = {sys:buf[1],touch:buf2[0] & 0x0E,slide:buf3[0]};
        nextEvtTO = setTimeout(()=>{
            if(prevEvt.touch != 0){
                switch(prevEvt.touch){
                    case 2:
                        eventData.tap = "DOWN";
                        eventData.cords = prevEvt.slide;
                        break;
                    case 4:
                        eventData.tap = "UP";
                        eventData.cords = prevEvt.slide;
                        break;
                    case 6:
                        eventData.tap = "MIDDLE";
                        eventData.cords = prevEvt.slide;
                        break;
                    case 8:
                        eventData.tap = "HOME";
                      break;
                 }
            }
            else{
            }
           
         },10);
    }
    return eventData;
};
;
const start =()=>{
    intervalId = setInterval(function(){
       if(cbHand != undefined)  cbHand(readEvents());
    },1000);
}
const setTouchCallback = (cb)=>{
    cbHand = cb;
};
function init(cfg){
    i2c = cfg.i2c;
    sensorMode = cfg.mode || 0;
    rdyPin = cfg.rdyPin;
    
    prevEvt = null;
    while(digitalRead(rdyPin));
    var data =read(0x01,2);// check reset bit
    if(data[0] & 0x80){
        if(dbg) console.log("POR detected");
        initSensor();
    }

   // start();
    const sensor = {
       // onTouch: onTouch,
        dbgReadRegisters: dbgReadRegisters,
        getTimerId: getTimerId,
        start:start,
        setDebugMode:setDebugMode,
        setTouchCallback: setTouchCallback
    };
    return sensor;
}

module.exports = init;