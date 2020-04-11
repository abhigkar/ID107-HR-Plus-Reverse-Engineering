//https://github.com/akashkapashia/IQS263-With-STM32/blob/master/IQS263.c
const IQS263_ADD = 0x44;
const DEVICE_INFO = 0x00;
const SYS_FLAGS = 0x01;
const COORDINATES = 0x02;
const TOUCH_BYTES = 0x03;
const COUNTS = 0x04;
const LTA = 0x05;
const DELTAS = 0x06;
const MULTIPLIERS = 0x07;
const COMPENSATION = 0x08;
const PROX_SETTINGS = 0x09;
const THRESHOLDS = 0x0A;
const TIMINGS_AND_TARGETS = 0x0B;
const GESTURE_TIMERS = 0x0C;
const ACTIVE_CHANNELS = 0x0D;
const PROX_SETTINGS0 = 0x09;


const ATI_BUSY = 0x04;
const SHOW_RESET = 0x80;
const PROX_EVENT = 0x01;
const TOUCH_EVENT = 0x02;
const SLIDE_EVENT = 0x04;
const MOVE_EVENT = 0x10;
const TAP_EVENT = 0x20;
const FLICKLEFT_EVENT = 0x40;
const FLICKRIGHT_EVENT = 0x80;

const EVENT_MODE = 0x40;
const HANDSHAKE_DELAY_HOLD = 11;
const HANDSHAKE_DELAY_SET = 200;
const ACK_RESET = 0x80;


var PROX_THRESHOLD	 = 0x10; //0x10
var TOUCH_THRESHOLD = 0x20;
var TOUCH_THRESHOLD_CH1 = 0x20; //0x20
var TOUCH_THRESHOLD_CH2 = 0x20; //0x20
var TOUCH_THRESHOLD_CH3 = 0x20; //0x20
var MOVEMENT_THRESHOLD = 0x03;
var RESEED_BLOCK = 0x00;
var HALT_TIME = 0x00;
var I2C_TIMEOUT = 0x04;

function Init_IQS263(){


}
function Monotor_Touch_IQS263()
function IQS263_READ_TOUCH_Events()

/*
var rdyPin = new Pin(17);
rdyPin.mode("input");

var countWatch  = 0;

var initWatch = setWatch(function(e) { 
  // watchdog to prevent runaway
  if( countWatch >= 10 ) clearWatch(initWatch);
  countWatch++;
  console.log(e.time-e.lastTime, e.state, rdyPin.read());
  }, rdyPin, { repeat:true, edge:'falling' }
);
*/