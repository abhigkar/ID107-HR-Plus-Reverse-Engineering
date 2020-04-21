//BangleJS
https://github.com/espruino/Espruino/blob/master/libs/banglejs/jswrap_bangle.c#L525
var i2c = new I2C();
i2c.setup({scl:5,sda:3});
var a = 0x1E;

function r(reg,len){
    i2c.writeTo(a, reg);
    return i2c.readFrom(a, len);
}

function w(reg, data){
    i2c.writeTo(a, [reg, data]);
}

function jswrap_banglejs_accelWr(reg, data){
    w(reg, data);
}

jswrap_banglejs_accelWr(0x18,0x0a); // CNTL1 Off (top bit)
jswrap_banglejs_accelWr(0x19,0x80); // CNTL2 Software reset
//jshDelayMicroseconds(2000);
jswrap_banglejs_accelWr(0x1a,0b10011000); // CNTL3 12.5Hz tilt, 400Hz tap, 0.781Hz motion detection
//jswrap_banglejs_accelWr(0x1b,0b00000001); // ODCNTL - 25Hz acceleration output data rate, filtering low-pass ODR/9
jswrap_banglejs_accelWr(0x1b,0b00000000); // ODCNTL - 12.5Hz acceleration output data rate, filtering low-pass ODR/9

jswrap_banglejs_accelWr(0x1c,0); // INC1 disabled
jswrap_banglejs_accelWr(0x1d,0); // INC2 disabled
jswrap_banglejs_accelWr(0x1e,0); // INC3 disabled
jswrap_banglejs_accelWr(0x1f,0); // INC4 disabled
jswrap_banglejs_accelWr(0x20,0); // INC5 disabled
jswrap_banglejs_accelWr(0x21,0); // INC6 disabled
jswrap_banglejs_accelWr(0x23,3); // WUFC wakeupi detect counter
jswrap_banglejs_accelWr(0x24,3); // TDTRC Tap detect enable
jswrap_banglejs_accelWr(0x25, 0x78); // TDTC Tap detect double tap (0x78 default)
jswrap_banglejs_accelWr(0x26, 0x65); // TTH Tap detect threshold high (0xCB default)
jswrap_banglejs_accelWr(0x27, 0x0D); // TTL Tap detect threshold low (0x1A default)
jswrap_banglejs_accelWr(0x30,1); // ATH low wakeup detect threshold
jswrap_banglejs_accelWr(0x35,0); // LP_CNTL no averaging of samples
//jswrap_banglejs_accelWr(0x35,2); // LP_CNTL 4x averaging of samples
jswrap_banglejs_accelWr(0x3e,0); // clear the buffer
jswrap_banglejs_accelWr(0x18,0b01101100);  // CNTL1 Off, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0
jswrap_banglejs_accelWr(0x18,0b11101100);  // CNTL1 On, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0



var buf = r(0x12,2);
var hasAccelData = (buf[1] & 16)!=0; {// DRDY
    console.log('>> ',hasAccelData);
    buf = r(6,6);
    var newx = (buf[1]<<8) | buf[0];
    var newy = (buf[3]<<8) | buf[2];
    var newz = (buf[5]<<8) | buf[4];
    console.log('x>> ',newx, 'y>> ', newy, 'z>> ', newz);
}
