//https://github.com/scientistnobee/Tubiditysensor/blob/master/Si1143_gain
//WORKING COPY OF CODE
var COMMAND = 0x18;
var HW_KEY =  0x07;
var PARAM_WR = 0x17;
var PARAM_RD = 0x2E;
var PART_ID = 0x00;
var REV_ID = 0x01;
var SEQ_ID = 0x02;
var INT_CFG = 0x03;
var IRQ_ENABLE = 0x04;
var IRQ_MODE1 = 0x05;
var MEAS_RATE = 0x08;
var ALS_RATE = 0x09;
var PS_RATE = 0x0A;
var PS_LED3 = 0x10;
var PS_LED21 = 0x0F;

var PARAM_CH_LIST = 0x01;
var PARAM_PS_ADC_GAIN = 0x0B;
var PARAM_PSLED12_SELECT = 0x02;
var PARAM_PS1_ADCMUX = 0x07;
var PARAM_PS2_ADCMUX = 0x08;
var PARAM_PS3_ADCMUX = 0x09;
var PARAM_PS_ADC_COUNTER =  0x0A;

var PSALS_AUTO_Cmd = 0b00001111;
var CHIP_STAT = 0x30;
var ALS_VIS_DATA0 = 0x22;
var ALS_VIS_DATA1 = 0x23;
var ALS_IR_DATA0 = 0x24;
var ALS_IR_DATA1 = 0x25;


var i2cAddr = '0x5a';


l = console.log;

function getReg(reg){
    i2c.writeTo(i2cAddr, reg);
    return i2c.readFrom(i2cAddr,1);
}

function setReg(reg, val){
    i2c.writeTo(i2cAddr, [reg, val]);
}

function readParam(addr){
    i2c.writeTo(i2cAddr, [COMMAND, (0x80 | addr)]);
    return  getReg(PARAM_RD);
}

function writeParam(addr, val){
    i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]); //?? COMMAND
}


function fetchALSData(){
    i2c.writeTo(i2cAddr, ALS_VIS_DATA0);
    var data =  new Int16Array(i2c.readFrom(i2cAddr,4).buffer);
    return data;
}



function initPulsePlug(){
    setReg(HW_KEY, 0x17);
    setReg(INT_CFG, 0x03);
    setReg(IRQ_ENABLE, 0x0F);
    setReg(IRQ_MODE1, 0x0F);
    setReg(MEAS_RATE, 0x84);
    setReg(ALS_RATE, 0x08);
    setReg(PS_RATE, 0x08);
    setReg(PS_LED3, 0x02);
    setReg(PS_LED21, 0x00);
    writeParam(PARAM_CH_LIST, 0x77);
    writeParam(PARAM_PS_ADC_GAIN, 0x00);
    writeParam(PARAM_PSLED12_SELECT, 0x21);
    writeParam(PARAM_PS1_ADCMUX, 0x03);
    writeParam(PARAM_PS2_ADCMUX, 0x03);
    writeParam(PARAM_PS3_ADCMUX, 0x03);
    writeParam(PARAM_PS_ADC_COUNTER, 0b01110000);
    setReg(COMMAND, PSALS_AUTO_Cmd);
}

function readValues(nTimes){
  var count = 0;
    var intId = setInterval(()=> {
      if(count >nTimes) clearInterval(intId);
      let data = fetchALSData();
      l("test_vis ", data[0]);
      l("test_ir ", data[1]);

      count++;
    },500);
}

var i2c = new I2C();
i2c.setup({ sda: 10, scl: 9 });
initPulsePlug();
readValues(50);