//https://github.com/goran-mahovlic/openwatch/blob/master/ID107HR_Plus/Arduino/libraries/IQS263/IQS263.cpp

// I2C DEFAULT SLAVE ADDRESS
var  IQS263_ADDR = 0x44;

/*********************** IQS263 REGISTERS *************************************/
var  DEVICE_INFO = 0x00;
var  SYS_FLAGS = 0x01;
var  COORDINATES = 0x02;
var  TOUCH_BYTES = 0x03;
var  COUNTS = 0x04;
var  LTA = 0x05;
var  DELTAS = 0x06;
var  MULTIPLIERS = 0x07;
var  COMPENSATION = 0x08;
var  PROX_SETTINGS = 0x09;
var  THRESHOLDS = 0x0A;
var  TIMINGS_AND_TARGETS = 0x0B;
var  GESTURE_TIMERS = 0x0C;
var  ACTIVE_CHANNELS = 0x0D;


/* Used to switch Projected mode & set Global Filter Halt (0x01 Byte1) */
var  SYSTEM_FLAGS_VAL = 0x00;

/* Enable / Disable system events (0x01 Byte2)*/
var  SYSTEM_EVENTS_VAL = 0x00;

/* Change the Multipliers & Base value (0x07 in this order) */
var  MULTIPLIERS_CH0 = 0x08; //0x19 - default
var  MULTIPLIERS_CH1 = 0x08;//0x08 - default
var  MULTIPLIERS_CH2 = 0x08;//0x08 - default
var  MULTIPLIERS_CH3 = 0x08;//0x08 - default
var  BASE_VAL        = 0x08;//0x44 - default

/* Change the Compensation for each channel (0x08 in this order) */
var  COMPENSATION_CH0 = 0x51;
var  COMPENSATION_CH1 = 0x49;
var  COMPENSATION_CH2 = 0x4A;
var  COMPENSATION_CH3 = 0x49;

/* Change the Prox Settings or setup of the IQS263 (0x09 in this order) */
var  PROXSETTINGS0_VAL = 0x00;
var  PROXSETTINGS1_VAL = 0x1D;
var  PROXSETTINGS2_VAL = 0x04;
var  PROXSETTINGS3_VAL = 0x00;
var  EVENT_MASK_VAL = 0x00;

/* Change the Thresholds for each channel (0x0A in this order) */
var  PROX_THRESHOLD = 0x08;
var  TOUCH_THRESHOLD_CH1 = 0x20;
var  TOUCH_THRESHOLD_CH2 = 0x20;
var  TOUCH_THRESHOLD_CH3 = 0x20;
var  MOVEMENT_THRESHOLD = 0x03;
var  RESEED_BLOCK = 0x00;
var  HALT_TIME = 0x14;
var  I2C_TIMEOUT = 0x04;

/* Change the Timing settings (0x0B in this order) */
var  LOW_POWER = 0x00;
var  ATI_TARGET_TOUCH = 0x30;
var  ATI_TARGET_PROX = 0x40;
var  TAP_TIMER = 0x05;
var  FLICK_TIMER = 0x51;
var  FLICK_THRESHOLD = 0x33;

/* Set Active Channels (0x0D) */
var  ACTIVE_CHS = 0x0F;


//SET UP
var rdyPin;
var sdaPin;
var slcPin;

var i2c;

var timeout;

function CommsIQS_start(){
    timeout=400;
    while(digitalRead(rdyPin) );              //wait for the IQS to change from ready to not ready
}

function CommsIQS_stop(){
    
    timeout=400;
    while(digitalRead(rdyPin) );
    timeout=400;
    while(!digitalRead(rdyPin) );
}

function CommsIQS_Write(data){
    i2c.writeTo(IQS263_ADDR, data);
}


function CommsIQS_Read(addr, len){
    i2c.writeTo({address:IQS263_ADDR, stop:false}, addr);
    return i2c.readFrom(IQS263_ADDR, len);
}

function init(){
    rdyPin = new Pin(17);
    sdaPin = D16;
    slcPin = D15;
    i2c = new I2C();

    rdyPin.mode("input");


    i2c.setup({scl:slcPin,sda:sdaPin});

    CommsIQS_start();
    var data_buffer = CommsIQS_Read(DEVICE_INFO, 2);
    CommsIQS_stop();
    print(data_buffer);
	if (data_buffer[0]!=0x3C)
	{
		return -2;
    }
    
    // Switch the IQS263 into projection mode - if necessary
    CommsIQS_start();
    CommsIQS_Write([SYS_FLAGS, SYSTEM_FLAGS_VAL]);
    CommsIQS_stop();

    // Set active channels
    data_buffer[0] = ACTIVE_CHS;
    CommsIQS_start();
    CommsIQS_Write([ACTIVE_CHANNELS, ACTIVE_CHS]);
    CommsIQS_stop();

    // Setup touch and prox thresholds for each channel
    CommsIQS_start();
    CommsIQS_Write( [THRESHOLDS, PROX_THRESHOLD, TOUCH_THRESHOLD_CH1, 
        TOUCH_THRESHOLD_CH2,TOUCH_THRESHOLD_CH3,
        MOVEMENT_THRESHOLD, RESEED_BLOCK, 
        HALT_TIME, I2C_TIMEOUT]);
    CommsIQS_stop();

    // Set the ATI Targets (Target Counts)
    CommsIQS_start();
    CommsIQS_Write([TIMINGS_AND_TARGETS, ATI_TARGET_TOUCH, ATI_TARGET_PROX]);
    CommsIQS_stop();

    // Set the BASE value for each channel
    CommsIQS_start();
    CommsIQS_Write([MULTIPLIERS, MULTIPLIERS_CH0, MULTIPLIERS_CH1,
        MULTIPLIERS_CH2, MULTIPLIERS_CH3]);
    CommsIQS_stop();

     // Setup prox settings
     CommsIQS_start();
     CommsIQS_Write([PROX_SETTINGS, PROXSETTINGS0_VAL, (PROXSETTINGS1_VAL|0x40), PROXSETTINGS2_VAL,
        PROXSETTINGS3_VAL, EVENT_MASK_VAL]);
     CommsIQS_stop();

     // Setup Compensation (PCC)
    CommsIQS_start();
    CommsIQS_Write([COMPENSATION, COMPENSATION_CH0, COMPENSATION_CH1, COMPENSATION_CH2, COMPENSATION_CH3]);
    CommsIQS_stop();

    // Set timings on the IQS263
    data_buffer[0] = LOW_POWER;
    CommsIQS_start();
    CommsIQS_Write([TIMINGS_AND_TARGETS, LOW_POWER]);
    CommsIQS_stop();

    // Set gesture timers on IQS263
     CommsIQS_start();
    CommsIQS_Write([GESTURE_TIMERS,TAP_TIMER, FLICK_TIMER, FLICK_THRESHOLD]);
    CommsIQS_stop();

    // Redo ati
    CommsIQS_start();
    CommsIQS_Write([PROX_SETTINGS, 0x10]);
    CommsIQS_stop();


    /*var timeoutCount=10;
    var buff;
    do {
        CommsIQS_start();
        buff = CommsIQS_Read(SYS_FLAGS,1);
        CommsIQS_stop();
    }
    while ((buff[0] & 0b00000100) && (timeoutCount-- > 0) );

    if (buff[0] & 0b00000100)
	{
		print("Timed out");
		return -1;
    }*/
    
    CommsIQS_start();
    buff = CommsIQS_Read(PROX_SETTINGS, 2);
    CommsIQS_stop();
    if (buff[1] & 0x02)
	{
		
		return 1;//Serial.println("Automatic Tuning Implementation occured");
    }
    return 0;
}

function getEvents(){
    var data_buffer;
    var evt = {};
    CommsIQS_start();   	// Start the communication session
    data_buffer = CommsIQS_Read(SYS_FLAGS,2);  // Read the system flags register to enable all events
	evt.eventFlags=data_buffer[1];
    
    CommsIQS_stop(); // Workaround for problem in Wire lib
 	CommsIQS_start();// Workaround for problem in Wire lib

    data_buffer = CommsIQS_Read(TOUCH_BYTES, 1); // Read from the touch bytes register to enable touch events
	evt.touchFlags=data_buffer[0];

	CommsIQS_stop(); // Workaround for problem in Wire lib
	CommsIQS_start();// Workaround for problem in Wire lib

    data_buffer = CommsIQS_Read(COORDINATES, 3);  // Read the coordinates register to get slider coordinates
	evt.wheelPos=data_buffer[0];
	evt.relativePos = (data_buffer[1]  | data_buffer[2]<<8);	
	CommsIQS_stop();       // Stop the communication session
	
    events = evt.eventFlags;
	print('events >> ', events);
	return evt;
}
init()
print("Init OK");
var counter =0;
var intVal = setInterval(()=>{
if(counter > 60) clearInterval(intVal);
getEvents();
counter++;
},1000);