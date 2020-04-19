
#include <jswrap_id107hp.h>
#include "jsinteractive.h"
#include "jsdevices.h"
#include "jsnative.h"
#include "jshardware.h"
#include "jsdevices.h"
#include "jspin.h"
#include "jstimer.h"
#include "jswrap_promise.h"
#include "jswrap_date.h"
#include "jswrap_math.h"
#include "jswrap_storage.h"
#include "jswrap_array.h"
#include "jswrap_arraybuffer.h"
#include "jswrap_heatshrink.h"
#include "jsflash.h"
#ifndef EMSCRIPTEN
#include "jswrap_bluetooth.h"
#include "nrf_gpio.h"
#include "nrf_delay.h"
#include "nrf_soc.h"
#include "nrf_saadc.h"
#include "nrf5x_utils.h"
#include "bluetooth.h" // for self-test
#include "jsi2c.h" // accelerometer/etc
#endif


/*JSON{
  "type": "class",
  "class" : "Id107hp"
}
*/

/*JSON{
  "type" : "event",
  "class" : "Id107hp",
  "name" : "accel",
  "params" : [["xyz","JsVar",""]]
}
Accelerometer data available with `{x,y,z,diff}` object as a parameter.

* `x` is X axis (left-right) in `g`
* `y` is Y axis (up-down) in `g`
* `z` is Z axis (in-out) in `g`
* `diff` is difference between this and the last reading in `g`

You can also retrieve the most recent reading with `Id107hp.getAccel()`.
 */


#define ACCEL_HISTORY_LEN 50 ///< Number of samples of accelerometer history

typedef struct {
  short x,y,z;
} Vector3;

#define DEFAULT_ACCEL_POLL_INTERVAL 80 // in msec - 12.5 to match accelerometer
#define ACCEL_POLL_INTERVAL_MAX 5000 // in msec - DEFAULT_ACCEL_POLL_INTERVAL_MAX+TIMER_MAX must be <65535
#define TIMER_MAX 60000 // 60 sec - enough to fit in uint16_t without overflow if we add ACCEL_POLL_INTERVAL


JshI2CInfo i2cAccel; // Accelerometer
JshI2CInfo i2cTouch; //Touch Sensor
JshI2CInfo i2cHeartRate; //Heart Rate




/// How often should be poll for accelerometer?
volatile uint16_t pollInterval; // in ms

/// accelerometer data
Vector3 acc;
/// squared accelerometer magnitude
int accMagSquared;
/// accelerometer difference since last reading
int accdiff;
/// History of accelerometer readings
int8_t accHistory[ACCEL_HISTORY_LEN*3];
/// Index in accelerometer history of the last sample
volatile uint8_t accHistoryIdx;



typedef enum {
  JSBF_NONE,
  JSBF_WAKEON_FACEUP = 1,
  JSBF_WAKEON_BTN1   = 2,
  JSBF_WAKEON_BTN2   = 4,
  JSBF_WAKEON_BTN3   = 8,
  JSBF_WAKEON_TOUCH  = 16,
  JSBF_WAKEON_TWIST  = 32,

  JSBF_DEFAULT =
      JSBF_WAKEON_TWIST|
      JSBF_WAKEON_BTN1|JSBF_WAKEON_BTN2|JSBF_WAKEON_BTN3
} JsId107Flags;
volatile JsId107Flags id107Flags;

typedef enum {
  JSBT_NONE,
  JSBT_LCD_ON = 1,
  JSBT_LCD_OFF = 2,
  JSBT_ACCEL_DATA = 4, ///< need to push xyz data to JS
  JSBT_ACCEL_TAPPED = 8, ///< tap event detected
  JSBT_GPS_DATA = 16, ///< we got a complete set of GPS data in 'gpsFix'
  JSBT_GPS_DATA_LINE = 32, ///< we got a line of GPS data
  JSBT_MAG_DATA = 64, ///< need to push magnetometer data to JS
  JSBT_RESET = 128, ///< reset the watch and reload code from flash
  JSBT_GESTURE_DATA = 256, ///< we have data from a gesture
  JSBT_CHARGE_EVENT = 512, ///< we need to fire a charging event
  JSBT_STEP_EVENT = 1024, ///< we've detected a step via the pedometer
  JSBT_SWIPE_LEFT = 2048, ///< swiped left over touchscreen
  JSBT_SWIPE_RIGHT = 4096, ///< swiped right over touchscreen
  JSBT_SWIPE_MASK = JSBT_SWIPE_LEFT | JSBT_SWIPE_RIGHT,
  JSBT_TOUCH_LEFT = 8192, ///< touch lhs of touchscreen
  JSBT_TOUCH_RIGHT = 16384, ///< touch rhs of touchscreen
  JSBT_TOUCH_MASK = JSBT_TOUCH_LEFT | JSBT_TOUCH_RIGHT,
  JSBT_HRM_DATA = 32768, ///< Heart rate data is ready for analysis
  JSBT_TWIST_EVENT = 65536, ///< Watch was twisted
} JsId107Tasks;

JsId107Tasks id107Tasks;



char clipi8(int x) {
  if (x<-128) return -128;
  if (x>127) return 127;
  return (char)x;
}

#ifndef EMSCRIPTEN
/* Scan peripherals for any data that's needed
 * Also, holding down both buttons will reboot */
void peripheralPollHandler() {
  unsigned char buf[7];
  // poll KX023 accelerometer (no other way as IRQ line seems disconnected!)
  // read interrupt source data
  buf[0]=0x12; // INS1
  jsi2cWrite(&i2cAccel, ACCEL_ADDR, 1, buf, true);
  jsi2cRead(&i2cAccel, ACCEL_ADDR, 2, buf, true);
  // 0 -> 0x12 INS1 - tap event
  // 1 -> 0x13 INS2 - what kind of event
  bool hasAccelData = (buf[1]&16)!=0; // DRDY
  int tapType = (buf[1]>>2)&3; // TDTS0/1
  if (hasAccelData) {
    buf[0]=6;
    jsi2cWrite(&i2cAccel, ACCEL_ADDR, 1, buf, true);
    jsi2cRead(&i2cAccel, ACCEL_ADDR, 6, buf, true);
    // work out current reading in 16 bit
    short newx = (buf[1]<<8)|buf[0];
    short newy = (buf[3]<<8)|buf[2];
    short newz = (buf[5]<<8)|buf[4];
    int dx = newx-acc.x;
    int dy = newy-acc.y;
    int dz = newz-acc.z;
    acc.x = newx;
    acc.y = newy;
    acc.z = newz;
    accMagSquared = acc.x*acc.x + acc.y*acc.y + acc.z*acc.z;
    accdiff = dx*dx + dy*dy + dz*dz;
    // save history
    accHistoryIdx = (accHistoryIdx+3) % sizeof(accHistory);
    accHistory[accHistoryIdx  ] = clipi8(newx>>7);
    accHistory[accHistoryIdx+1] = clipi8(newy>>7);
    accHistory[accHistoryIdx+2] = clipi8(newz>>7);
    // trigger accelerometer data task
    id107Tasks |= JSBT_ACCEL_DATA;

  }
}

#endif // !EMSCRIPTEN



/*JSON{
    "type" : "staticmethod",
    "class" : "Id107hp",
    "name" : "setPollInterval",
    "generate" : "jswrap_id107hp_setPollInterval",
    "params" : [
      ["interval","float","Polling interval in milliseconds"]
    ]
}
Set how often the watch should poll for new acceleration/gyro data
*/
void jswrap_id107hp_setPollInterval(JsVarFloat interval) {
  if (!isfinite(interval) || interval<10 || interval>ACCEL_POLL_INTERVAL_MAX) {
    jsExceptionHere(JSET_ERROR, "Invalid interval");
    return;
  }
  pollInterval = (uint16_t)interval;
#ifndef EMSCRIPTEN
  JsSysTime t = jshGetTimeFromMilliseconds(pollInterval);
  jstStopExecuteFn(peripheralPollHandler, 0);
  jstExecuteFn(peripheralPollHandler, NULL, jshGetSystemTime()+t, t);
#endif
}




/*JSON{
    "type" : "staticmethod",
    "class" : "Id107hp",
    "name" : "getAccel",
    "generate" : "jswrap_id107hp_getAccel",
    "return" : ["JsVar","An object containing accelerometer readings (as below)"]
}
Get the most recent accelerometer reading. Data is in the same format as the `Id107hp.on('accel',` event.

* `x` is X axis (left-right) in `g`
* `y` is Y axis (up-down) in `g`
* `z` is Z axis (in-out) in `g`
* `diff` is difference between this and the last reading in `g`
* `mag` is the magnitude of the acceleration in `g`
*/
JsVar *jswrap_id107hp_getAccel() {
  JsVar *o = jsvNewObject();
  if (o) {
    jsvObjectSetChildAndUnLock(o, "x", jsvNewFromFloat(acc.x/8192.0));
    jsvObjectSetChildAndUnLock(o, "y", jsvNewFromFloat(acc.y/8192.0));
    jsvObjectSetChildAndUnLock(o, "z", jsvNewFromFloat(acc.z/8192.0));
    jsvObjectSetChildAndUnLock(o, "mag", jsvNewFromFloat(sqrt(accMagSquared)/8192.0));
    jsvObjectSetChildAndUnLock(o, "diff", jsvNewFromFloat(sqrt(accdiff)/8192.0));
  }
  return o;
}

/*JSON{
  "type" : "init",
  "generate" : "jswrap_id107hp_init"
}*/
void jswrap_id107hp_init() {
#ifndef EMSCRIPTEN
  // Set up I2C
  jshI2CInitInfo(&i2cAccel);
  i2cAccel.bitrate = 0x7FFFFFFF; // make it as fast as we can go
  i2cAccel.pinSDA = ACCEL_PIN_SDA;
  i2cAccel.pinSCL = ACCEL_PIN_SCL;
  jshPinSetValue(i2cAccel.pinSCL, 1);
  jshPinSetState(i2cAccel.pinSCL, JSHPINSTATE_GPIO_OUT_OPENDRAIN_PULLUP);
  jshPinSetValue(i2cAccel.pinSDA, 1);
  jshPinSetState(i2cAccel.pinSDA, JSHPINSTATE_GPIO_OUT_OPENDRAIN_PULLUP);
  jshDelayMicroseconds(10000);
#endif
  id107Flags = JSBF_DEFAULT;


#ifndef EMSCRIPTEN
  // KX023-1025 accelerometer init
  jswrap_id107hp_accelWr(0x18,0x0a); // CNTL1 Off (top bit)
  jswrap_id107hp_accelWr(0x19,0x80); // CNTL2 Software reset
  jshDelayMicroseconds(2000);
  jswrap_id107hp_accelWr(0x1a,0b10011000); // CNTL3 12.5Hz tilt, 400Hz tap, 0.781Hz motion detection
  //jswrap_id107hp_accelWr(0x1b,0b00000001); // ODCNTL - 25Hz acceleration output data rate, filtering low-pass ODR/9
  jswrap_id107hp_accelWr(0x1b,0b00000000); // ODCNTL - 12.5Hz acceleration output data rate, filtering low-pass ODR/9

  jswrap_id107hp_accelWr(0x1c,0); // INC1 disabled
  jswrap_id107hp_accelWr(0x1d,0); // INC2 disabled
  jswrap_id107hp_accelWr(0x1e,0); // INC3 disabled
  jswrap_id107hp_accelWr(0x1f,0); // INC4 disabled
  jswrap_id107hp_accelWr(0x20,0); // INC5 disabled
  jswrap_id107hp_accelWr(0x21,0); // INC6 disabled
  jswrap_id107hp_accelWr(0x23,3); // WUFC wakeupi detect counter
  jswrap_id107hp_accelWr(0x24,3); // TDTRC Tap detect enable
  jswrap_id107hp_accelWr(0x25, 0x78); // TDTC Tap detect double tap (0x78 default)
  jswrap_id107hp_accelWr(0x26, 0x65); // TTH Tap detect threshold high (0xCB default)
  jswrap_id107hp_accelWr(0x27, 0x0D); // TTL Tap detect threshold low (0x1A default)
  jswrap_id107hp_accelWr(0x30,1); // ATH low wakeup detect threshold
  jswrap_id107hp_accelWr(0x35,0); // LP_CNTL no averaging of samples
  //jswrap_id107hp_accelWr(0x35,2); // LP_CNTL 4x averaging of samples
  jswrap_id107hp_accelWr(0x3e,0); // clear the buffer
  jswrap_id107hp_accelWr(0x18,0b01101100);  // CNTL1 Off, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0
  jswrap_id107hp_accelWr(0x18,0b11101100);  // CNTL1 On, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0
#endif

  // Other IO
#ifndef EMSCRIPTEN
  // Add watchdog timer to ensure watch always stays usable (hopefully!)
  // This gets killed when _kill / _init happens
  //  - the bootloader probably already set this up so the
  //    enable will do nothing - but good to try anyway
  ////////////////////////////////jshEnableWatchDog(5); // 5 second watchdog
  // This timer kicks the watchdog, and does some other stuff as well
  pollInterval = DEFAULT_ACCEL_POLL_INTERVAL;
  JsSysTime t = jshGetTimeFromMilliseconds(pollInterval);
  jstExecuteFn(peripheralPollHandler, NULL, jshGetSystemTime()+t, t);
#endif
}

/*JSON{
  "type" : "kill",
  "generate" : "jswrap_id107hp_kill"
}*/
void jswrap_id107hp_kill() {
#ifndef EMSCRIPTEN
  jstStopExecuteFn(peripheralPollHandler, 0);
#endif
}

/*JSON{
  "type" : "idle",
  "generate" : "jswrap_id107hp_idle"
}*/
bool jswrap_id107hp_idle() {
  /* TODO: Check jsiObjectHasCallbacks/etc here and then don't
   * fire the event in our peripheralPollHandler/hrmPoll/etc if there's
   * nothing to see the event
   */
  if (id107Tasks == JSBT_NONE) return false;
  JsVar *id107 =jsvObjectGetChild(execInfo.root, "Id107hp", 0);
  if (id107Tasks & JSBT_ACCEL_DATA) {
    if (id107 && jsiObjectHasCallbacks(id107, JS_EVENT_PREFIX"accel")) {
      JsVar *o = jswrap_id107hp_getAccel();
      if (o) {
        jsiQueueObjectCallbacks(id107, JS_EVENT_PREFIX"accel", &o, 1);
        jsvUnLock(o);
      }
    }
  }
  jsvUnLock(id107);
  id107Tasks = JSBT_NONE;
  return false;
}

/*JSON{
    "type" : "staticmethod",
    "class" : "Id107hp",
    "name" : "accelWr",
    "generate" : "jswrap_id107hp_accelWr",
    "params" : [
      ["reg","int",""],
      ["data","int",""]
    ]
}
Writes a register on the KX023 Accelerometer
*/
void jswrap_id107hp_accelWr(JsVarInt reg, JsVarInt data) {
#ifndef EMSCRIPTEN
  unsigned char buf[2];
  buf[0] = (unsigned char)reg;
  buf[1] = (unsigned char)data;
  jsi2cWrite(&i2cAccel, ACCEL_ADDR, 2, buf, true);
#endif
}

/*JSON{
    "type" : "staticmethod",
    "class" : "Id107hp",
    "name" : "accelRd",
    "generate" : "jswrap_id107hp_accelRd",
    "params" : [
      ["reg","int",""]
    ],
    "return" : ["int",""]
}
Reads a register from the KX023 Accelerometer
*/
int jswrap_id107hp_accelRd(JsVarInt reg) {
#ifndef EMSCRIPTEN
  unsigned char buf[1];
  buf[0] = (unsigned char)reg;
  jsi2cWrite(&i2cAccel, ACCEL_ADDR, 1, buf, true);
  jsi2cRead(&i2cAccel, ACCEL_ADDR, 1, buf, true);
  return buf[0];
#else
  return 0;
#endif
}


/*JSON{
    "type" : "staticmethod",
    "class" : "Id107hp",
    "name" : "off",
    "generate" : "jswrap_id107hp_off"
}
Turn Id107hp.js off. It can only be woken by pressing BTN1.
*/
void jswrap_id107hp_off() {
#ifndef EMSCRIPTEN
  jswrap_id107hp_accelWr(0x18,0x0a); // accelerometer off
#else
  jsExceptionHere(JSET_ERROR, ".off not implemented on emulator");
#endif
}


/*JSON{
	  "type" : "staticmethod",
	  "class" : "Id107hp",
	  "name" : "world",
	  "generate" : "jswrap_id107hp_world"
}
A Test methos for print message
*/
void jswrap_id107hp_world() {
    jsiConsolePrint("Hello World!\r\n");
}
