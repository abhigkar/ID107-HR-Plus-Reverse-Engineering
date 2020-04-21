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
    if(buf[1] & 0x01) event.prox = true; else  event.prox = false;
    
    if(buf[1] & 0x02) {
        event.touch  = true; 
        let timeout = 400;
        while(digitalRead(rdyPin) &&  --timeout);
        buf = read(0x03,2);
        event.touchData.d1 = buf[0];
        event.touchData.d2 = buf[1];
        timeout = 400;
        while(digitalRead(rdyPin) &&  --timeout);
        buf = read(0x02,3);
        event.cordData.d1 = buf[0];
        event.cordData.d2 = buf[1];
        event.cordData.d2 = buf[2];
    }else {
        event.touch  = false;
    }
    if(buf[1] & 0x20) event.tap  = true; else  event.tap = false;
    if(buf[1] & 0x40) event.flickLeft  = true; else  event.flickLeft  = false;
    if(buf[1] & 0x80) event.flickRight  = true; else  event.flickRight  = false;
    if(buf[1] & 0x04) event.slide  = true; else  event.slide  = false;

    return true;
} 

function handleInterrupt(){
    if (doInitialSetup) {
        print('Initial setup started');
		if(!init_setup()){
            clearWatch(irqHandleId);
            print('Device Not found, IRQ is cleared');
        }
        print('Initial setup completed');
		doInitialSetup = false;
		return;
	}
    if(!readEvents()){
        //print('NO EVENT');
        return;
    }
    if(showReset){
        doInitialSetup = true;
        clearWatch(irqHandleId);
        print('Show Reset Flag is ON. IRQ is cleared');
    }

    if(event.flickLeft) print('Report >> flickLeft');
    if(event.flickRight) print('Report >> flickRight');

    if(currentState == 0){
        if (event.touch) {
			//print("Touch0 :",event.touchData.d1);
			if(event.slide | event.flickLeft | event.flickRight)
			    currentState = 1;
		} else if(event.slide){
			//print("SliderCoords : ",((event.cordData.d3<<8)|event.cordData.d2));
			currentState = 1;
		}else
			currentState = 0;
    }
    if (currentState == 1) {
		/*	check the Slide Corrds */
		if (event.slide) {
			//sliderCoords = data_buffer[3];
			print("SliderCoords : ",((event.cordData.d3<<8)|event.cordData.d2));
            print('Report >> BTN_TOUCH ON');
            setTimeout(()=>{
                if (currentState > 0) {
                    /*	Now from here Reseed and go back to State 0	*/
                    currentState = 0;
                    print("Touch Timeout\n");
                    print('Report >> BTN_TOUCH OFF');
                }
            },50);
			return;
		}

		/*	Touch is still active - check other event	*/
		if (event.touch) {
			print("Touch0 :",event.touchData.d1);
			currentState = 0;
			print('Report >> BTN_TOUCH OFF');
		}else if(event.prox){
			print("Prox End");
			print('Report >> BTN_TOUCH OFF');
			currentState = 0;
		}
	} /*	end State 1	*/
}


function init_setup(){
    var deviceinfo = read(0x00,2);// read device info
    if (deviceinfo[0]!=0x3C)
	{
        print('Device not found');
        return false;
    }
    write([0x01, 0x00]);  //set in projection mode
    write([0x0D,0x07]);
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
    i2c.setup({scl:slcPin,sda:sdaPin});

    event_handshake();
    irqHandleId = setWatch(handleInterrupt, rdyPin, {repeat: true, edge: 'falling',debounce:0 });

    showReset=false;
    doInitialSetup = true;
    currentState = 0;

    print('IQR received ',irqHandleId);
}

function kill(){
    clearWatch(irqHandleId);
}