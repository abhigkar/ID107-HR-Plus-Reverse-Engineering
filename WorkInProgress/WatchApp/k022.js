const i2cAddress = 0x1E;
let i2c = null;
const read = (reg,len) =>{
    i2c.writeTo(i2cAddress, reg);
    return i2c.readFrom(i2cAddress, len);
};

const write = (reg, data) =>{
    i2c.writeTo(i2cAddress, [reg, data]); 
};

const readRawAcce = ()=>{
    let buf = read(0x12,2);
    if((buf[1] & 16)!=0){// DRDY
        let coords=new Int16Array(this.r(6,6).buffer);
        return coords;
    }
};
const readAcce = ()=>{
    var d =  readRawAcce();
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

function init(cfg){
    i2c = cfg.i2c;

    if (read(0x0F,1)[0]!=20) throw new Error("WHO_AM_I incorrect");

    write(0x18,0x0a); write(0x19,0x80); write(0x1a,0x98); write(0x1b,0x00); write(0x1c,0x00);
    write(0x1d,0x00); write(0x1e,0x00); write(0x1f,0x00); write(0x20,0x00); write(0x21,0x00); 
    write(0x23,0x03); write(0x24,0x03); write(0x25,0x78); write(0x26,0x65); write(0x27, 0x0D); 
    write(0x30,0x01); write(0x35,0x00); write(0x3e,0x00); write(0x18,0x6C); write(0x18,0xEC); 

    const result = {
        readRaw: readRawAcce,
        readAcce: readAcce
    };
    return result;
}



exports.module = init;