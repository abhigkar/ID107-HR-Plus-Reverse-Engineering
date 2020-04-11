/* Written by Allen Mackey */
//Espruino code
//var i2c = new I2C();
//i2c.setup({ scl : D30, sda: D31 });
//var acc = require("https://github.com/allmackey/espruino/blob/master/KX022.js").connectI2C(i2c);
//print(acc.read()); // prints { x: ..., y: ..., z: ... }

var a =  0x1F;   //0x1E(scanned)
var REG = { 
    WHO_AM_I: 0x0F,
    OUTX_L: 0x06,
    OUTX_H: 0x07,
    OUTY_L: 0x08,
    OUTY_H: 0x09,
    OUTZ_L: 0x0A,
    OUTZ_H: 0x0B,
    CNTL1: 0x18,
    CNTL3: 0x1A,
    ODCNTL: 0x1B,
    SLAVE: 0x1E,
    WAI_VAL: 0x14,
    LP_CNTL: 0x35,
  };
  

function r(reg,len){
    { // read
        i2c.writeTo(a, reg);
        return i2c.readFrom(a, len);
      }
}
function w(reg, data){
    i2c.writeTo(a, [reg, data]);
}

var i2c = new I2C();
i2c.setup({scl:5,sda:3});

  //tt
  function LIS2MDL(options,r,w) {
    this.r = r;
    this.w = w;
    if (this.r(REG.WHO_AM_I,1)[0]!=20) throw new Error("WHO_AM_I incorrect");
    //this.w(REG.CNTL1, 0x50); //config 0 1 0 1 0 0 0 0 OLD
    //this.w(REG.CNTL1, 0x10); //config 0 0 0 1 0 0 0 0 NEW
    //this.w(REG.CNTL1, 0xD0); //OLD
    //this.w(REG.LP_CNTL, 0x0B); //NEW
    //this.w(REG.CNTL1, 0x90); //NEW config 10010000
    // low pass filter, ODR/4
    //this.w(REG.CFG_B, 0x01);
    // data ready irq, block data read
    //this.w(REG.CFG_C, 0x11);
  }
  
  //tt
function init() {
    print("setting changes made (new0)");
    var res = new DataView(this.r(REG.CNTL1,1).buffer);
    this.w(REG.CNTL1, 0x00); //config 0 0 0 0 0 0 0 0
    res = new DataView(this.r(REG.CNTL1,1).buffer);
    print(res.getUint8(0,1));
    res = new DataView(this.r(REG.LP_CNTL,1).buffer);
    this.w(REG.LP_CNTL, 0x04); //NEW
    res = new DataView(this.r(REG.LP_CNTL,1).buffer);
    print(res.getUint8(0,1));
    res = new DataView(this.r(REG.CNTL1,1).buffer);
    this.w(REG.CNTL1, 0x80); //NEW config 10010000
    res = new DataView(this.r(REG.CNTL1,1).buffer);
    print(res.getUint8(0,1));
    //print("V4");
  };
  
  //tt
function read() {
    var d = new DataView(this.r(REG.OUTX_L,6).buffer);
    var xx = d.getInt16(0,1);
    var yy = d.getInt16(2,1);
    var zz = d.getInt16(4,1);
    var xp = 0;
    var yp = 0;
    var zp = 0;
    //var Pitch = (Math.atan2(yy, Math.sqrt(xx * xx + zz * zz))) * 180.00 / Math.PI;
    var Pitch = (Math.atan2(xx, Math.sqrt(yy * yy + zz * zz))) * 180.00 / Math.PI;
    var Roll = (Math.atan2(yy, Math.sqrt(zz * zz + xx * xx))) * 180.00 / Math.PI;
    var Tilt =  Math.sqrt(Pitch * Pitch + Roll * Roll);
    if (xx > 16384) {xx = 16384;}
    if (xx < -16384) {xx = -16384;}
    if (xx < 0) {xp=1; xx=-xx;}
    var xLL = xx & 0xff;
    var xHH = (xx >> 8);
    if (yy > 16384) {yy = 16384;}
    if (yy < -16384) {yy = -16384;}
    if (yy < 0) {yp=1; yy=-yy;}
    var yLL = yy & 0xff;
    var yHH = (yy >> 8);
    if (zz > 16384) {zz = 16384;}
    if (zz < -16384) {zz = -16384;}
    if (zz < 0) {zp=1; zz=-zz;}
    var zLL = zz & 0xff;
    var zHH = (zz >> 8);
    return {
      x:  xx,
      y:  yy, //d.getInt16(2,1),
      z:  zz, //d.getInt16(4,1),
      xL: xLL, //d.getInt8(0,1),
      yL: yLL, //d.getInt8(2,1),
      zL: zLL, //d.getInt8(4,1),
      xH: xHH, //d.getInt8(1,1),
      yH: yHH, //d.getInt8(3,1),
      zH: zHH, //d.getInt8(5,1),
      xP: xp,
      yP: yp,
      zP: zp,
      pitch: Pitch,
      roll: Roll,
      tilt: Tilt
    };
  };
  

  init();
  read();