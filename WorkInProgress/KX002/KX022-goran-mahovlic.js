//working
var KX022_ADDR_L = 0x1E;
var KX022_ADDR_H = 0x1F;
var KX022_ADDR_RESET = 0x1D;
var KX022_WHOAMI_REG = 0x0F;
var KX022_WHOAMI_RESPONSE = 0x14;
var KX022_CNTL1_REG = 0x18;
var KX022_CNTL1_VALUE_STANDBY = 0x41;
var KX022_ODCNTL_REG = 0x1B;
var KX022_ODCNTL_VALUE = 0x02;
var KX022_CNTL3_REG = 0x1A;
var KX022_CNTL3_VALUE = 0xD8;
var KX022_TILT_TIMER_REG = 0x22;
var KX022_TILT_TIMER_VALUE = 0x01;
var KX022_CNTL2_REG = 0x18;
var KX022_CNTL1_VALUE_OPERATE = 0xC1;
var KX022_ACC_OUTPUT_RATE_MASK = 0x00001111;
var KX022_ODR = [12.5,  25.0,   50.0,  100.0, 200.0, 400.0, 800.0, 1600.0, 0.781, 1.563, 3.125, 6.25];
var KX022_ACC_SENSITIVITY =[16384.0, 8192.0, 4096.0];

var KX022_RANGE_2G = 0b00000000;  // range +/-2g
var KX022_RANGE_4G = 0b00001000;  // range +/-4g
var KX022_RANGE_8G = 0b00011000;  // range +/-8g
var KX022_RANGE_MASK = 0b00011000;
var DATA_OUT_BASE = 0x06;

var a =  0x1E;   //0x1E(scanned)

function r(reg,len){
    { // read
        i2c.writeTo(a, reg);
        return i2c.readFrom(a, len);
      }
}
function w(reg, data){
    i2c.writeTo(a, [reg, data]);
}

function init(range, rate){
  _range = range;
    w(KX022_CNTL1_REG,
        (KX022_CNTL1_VALUE_STANDBY & ~KX022_ACC_OUTPUT_RATE_MASK) |
            (range & KX022_ACC_OUTPUT_RATE_MASK));
    w(KX022_ODCNTL_REG,
            (KX022_ODCNTL_VALUE & ~KX022_ACC_OUTPUT_RATE_MASK) |
                (rate & KX022_ACC_OUTPUT_RATE_MASK));
    w(KX022_CNTL3_REG, KX022_CNTL3_VALUE);
    w(KX022_TILT_TIMER_REG, KX022_TILT_TIMER_VALUE);

    // wait for registers to be set prior to coming out of standby = 1.2/ODR
    // (pg39 of the datasheet)
    var to = (1200.0/ KX022_ODR[rate]);
    setTimeout(() =>{
        w(KX022_CNTL1_REG,
            (KX022_CNTL1_VALUE_OPERATE & ~KX022_ACC_OUTPUT_RATE_MASK) |
                (range & KX022_ACC_OUTPUT_RATE_MASK));
    },to);
}
function getRawXYZ(base_reg_location)
{
   var d = r(base_reg_location,6);
   var xyz = [];
      xyz[0] = (d[0]| (d[1] << 8));
      xyz[1] = (d[2] | (d[3]<< 8));
      xyz[2] = (d[4]| (d[5] << 8));
   return xyz;
}

function getAccelXYZ()
{
   var xyz = [];
   var xyz_ = getRawXYZ(DATA_OUT_BASE);
   xyz[0] = (xyz_[0])  / KX022_ACC_SENSITIVITY[_range >> 3];
   xyz[1] = (xyz_[1])  / KX022_ACC_SENSITIVITY[_range >> 3];
   xyz[2] = (xyz_[2])  / KX022_ACC_SENSITIVITY[_range >> 3];

   return xyz;
}

var _range;
var i2c = new I2C();
i2c.setup({scl:5,sda:3});
init(KX022_RANGE_4G, 2);
var reading = getAccelXYZ();
console.log(reading);