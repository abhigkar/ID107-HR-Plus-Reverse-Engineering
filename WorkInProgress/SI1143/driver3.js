//https://github.com/scientistnobee/Tubiditysensor/blob/master/Si1143_gain
var MODE_CHANGE = 0x80;    // a pin mode was changed
var DIG_CHANGE  = 0x40;   // a digital output was changed
var PWM_CHANGE  = 0x30;   // an analog (pwm) value was changed on port 2..3
var ANA_MASK    = 0x0F;   // an analog read was requested on port 1..4

var COMMAND = 0x18;
var HW_KEY =  0x07;
var PARAM_WR = 0x00;
var PARAM_RD = 0x00;
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
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            i2c.writeTo(i2cAddr, reg);
            var data =  i2c.readFrom(i2cAddr,1);
            resolve(data);
        },10);
      });
      return promise;
}

function setReg(reg, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [reg, val]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}

function readParam(addr){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [COMMAND, (0x80 | addr)]);
        setTimeout(function() {
            getReg(PARAM_RD).then((data)=>{
                resolve(data);
            });
        },10);
      });
      return promise;
}

function writeParam(addr, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}


function fetchALSData(){
    i2c.writeTo(i2cAddr, ALS_VIS_DATA0);
    var data =  i2c.readFrom(i2cAddr,4);
    var als_data = {};
    als_data[0] = data[0];
    als_data[1] = (data[1] <<8 );
    als_data[2] = data[2];
    als_data[3] = (data[2] <<8 );
    return als_data;
}



function initPulsePlug(){
    setReg(HW_KEY, 0x17)
    .then(()=>{
        return getReg(PART_ID);
    }).then((partId)=>{
        l("PART: ", partId[0].toString(16));
        return getReg(REV_ID);
    }).then((revId)=>{
        l("REV: ", revId[0].toString(16));
        return getReg(SEQ_ID);
    }).then((seq)=>{
        l("SEQ: ", seq[0].toString(16));
        return setReg(INT_CFG, 0x03);
    }).then(()=>{
        return setReg(IRQ_ENABLE, 0x0F);
    }).then(()=>{
        return setReg(IRQ_MODE1, 0x0F);
    }).then(()=>{
        return setReg(MEAS_RATE, 0x84);
    }).then(()=>{
        return setReg(ALS_RATE, 0x08);
    }).then(()=>{
        return setReg(PS_RATE, 0x08);
    }).then(()=>{
        return setReg(PS_LED3, 0x02);
    }).then(()=>{
        return setReg(PS_LED21, 0x00);
    }).then(()=>{
        return getReg(PS_LED21);
    }).then((led21)=>{
        l("PS_LED21 = ", led21[0].toString(16));
        return readParam(0x01);
    }).then((data)=>{
        l("CHLIST = ", data[0].toString(16));
        return writeParam(PARAM_CH_LIST, 0x77);
    }).then((data)=>{
        return writeParam(PARAM_PS_ADC_GAIN, 0x00);
    }).then((data)=>{
        return writeParam(PARAM_PSLED12_SELECT, 0x21);
    }).then((data)=>{
        return writeParam(PARAM_PS1_ADCMUX, 0x03);
    }).then((data)=>{
        return writeParam(PARAM_PS2_ADCMUX, 0x03);
    }).then((data)=>{
        return writeParam(PARAM_PS3_ADCMUX, 0x03);
    }).then((data)=>{
        return writeParam(PARAM_PS_ADC_COUNTER, 0b01110000);
    }).then(()=>{
        return setReg(COMMAND, PSALS_AUTO_Cmd);
    }).then(()=>{
        return getReg(COMMAND, CHIP_STAT);
    }).then((chipStat)=>{
         l("CHIP_STAT = ", chipStat[0].toString(16));
    }).then((chipStat)=>{
        l("end init");
   });

}

function readValues(){
  var count = 0;
    var intId = setInterval(()=> {
      if(count >1) clearInterval(intId);
        Promise.all([getReg(ALS_VIS_DATA0),
                    getReg(ALS_VIS_DATA1),
                    getReg(ALS_IR_DATA0),
                    getReg(ALS_IR_DATA1)
                    ])
        .then(function(values) {
          l(values);
            let v = values[0] + 256*values[1];
            let vis = values[2] + 256*values[3];
            l("V_old ",v);
            l("Vis_new  ",vis);
            return [v, vis];
          })
          .then((data)=>{
            var alsSensor = fetchALSData();
            l(alsSensor[0], "I_old ",  data[1], " IR_new ", alsSensor[1]);
          })
          .catch((ex)=>{
          l(ex);
          clearInterval(intId);
        });
      count++;
    },500);
    l('Interval ',intId);
}

var i2c = new I2C();
i2c.setup({ sda: 10, scl: 9 });
initPulsePlug();
readValues();