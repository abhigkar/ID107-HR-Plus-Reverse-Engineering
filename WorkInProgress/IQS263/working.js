var rdyPin;
var sdaPin;
var slcPin;
var i2c;
var i2cAddr = 0x44;
var doInitialSetup;
var irqHandleId;

function readEvents(){
    while(digitalRead(rdyPin));
    buf = read(0x01,2);// events
    if(buf[1] ==0 || buf[1] ==1) return;
    while(digitalRead(rdyPin));
    buf2 = read(0x03,2);// touch 
    while(digitalRead(rdyPin));
    buf3 = read(0x02,3); //coordinates
    console.log(buf, buf2, buf3);

    let td = buf2[0] & 0xE;
    if((td<< 0x1E) <0 ) console.log("ch1");
    if((td<< 0x1D) <0 )  console.log("ch2");
    if((td<< 0x1C) <0 )  console.log("ch3");
    return true;
} 

function handleInterrupt(e){
    poke32(0x40010600,0x6E524635);
    if(e.state)return;
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
    write([0x0C,0x0A,0x14,0x38]);//Gesture Timers
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
        irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'falling',debounce:0 });
    });

    showReset=false;
    doInitialSetup = true;
    currentState = 0;
    setInterval(function(){poke32(0x40010600,0x6E524635);},100);
}

function kill(){
    clearWatch(irqHandleId);
}

