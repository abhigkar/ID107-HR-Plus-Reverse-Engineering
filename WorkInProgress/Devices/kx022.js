//Espruino code
//var i2c = new I2C();
//i2c.setup({scl:5,sda:3});
//var acc = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/KX022.js").connectI2C(i2c);
//print(acc.readAccel()); // prints { x: ..., y: ..., z: ... }


  

  function KX022(options,r,w) {
    this.r = r;
    this.w = w;
    if (this.r(0x0F,1)[0]!=20) throw new Error("WHO_AM_I incorrect");

  }
  

  KX022.prototype.init = function() {
    this.w(0x18,0x0a); // CNTL1 Off (top bit)
    this.w(0x19,0x80); // CNTL2 Software reset

    this.w(0x1a,0x98); // CNTL3 12.5Hz tilt, 400Hz tap, 0.781Hz motion detection
    //w(0x1b,0x01); // ODCNTL - 25Hz acceleration output data rate, filtering low-pass ODR/9
    this.w(0x1b,0x00); // ODCNTL - 12.5Hz acceleration output data rate, filtering low-pass ODR/9
    
    this.w(0x1c,0x00); // INC1 disabled
    this.w(0x1d,0x00); // INC2 disabled
    this.w(0x1e,0x00); // INC3 disabled
    this.w(0x1f,0x00); // INC4 disabled
    this.w(0x20,0x00); // INC5 disabled
    this.w(0x21,0x00); // INC6 disabled
    this.w(0x23,0x03); // WUFC wakeupi detect counter
    this.w(0x24,0x03); // TDTRC Tap detect enable
    this.w(0x25, 0x78); // TDTC Tap detect double tap (0x78 default)
    this.w(0x26, 0x65); // TTH Tap detect threshold high (0xCB default)
    this.w(0x27, 0x0D); // TTL Tap detect threshold low (0x1A default)
    this.w(0x30,0x01); // ATH low wakeup detect threshold
    this.w(0x35,0x00); // LP_CNTL no averaging of samples
    //w(0x35,0x02); // LP_CNTL 4x averaging of samples
    this.w(0x3e,0x00); // clear the buffer
    this.w(0x18,0x6C);  // CNTL1 Off, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0
    this.w(0x18,0xEC);  // CNTL1 On, high power, DRDYE=1, 4g range, TDTE (tap enable)=1, Wakeup=0, Tilt=0
  };
  
  KX022.prototype.readRawAccel = function() {
    var buf = this.r(0x12,2);
    var hasAccelData = (buf[1] & 16)!=0; 
    if(hasAccelData){// DRDY
        coords=new Int16Array(this.r(6,6).buffer);
        return coords;
    }
  }

 
  KX022.prototype.readAccel = function() {
    var d =  this.readRawAccel();
    if(!d) return;
    var xx = d[0];
    var yy = d[1];
    var zz = d[2];
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
  exports.KX022 = KX022;
  
  exports.connectI2C = function(i2c, options) {
    var a = (options&&options.addr) || 30;
    return (new KX022(options, function(reg, len) { // read
      i2c.writeTo(a, reg);
      return i2c.readFrom(a, len);
    }, function(reg, data) { // write
      i2c.writeTo(a, [reg, data]); 
    }));
  };