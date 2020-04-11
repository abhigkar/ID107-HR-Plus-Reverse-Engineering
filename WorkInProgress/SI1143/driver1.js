//https://github.com/McCITS/SI1143_test_OLED/blob/master/SI1143_test_OLED_0.3.ino
//https://github.com/Cornell-Engineering-World-Health/Si1143-Pulse-Oximetry

var regAddress = {
    PART_ID : 0x00,
    REV_ID : 0x01,
    SEQ_ID : 0x02,
    INT_CFG : 0x03,
    IRQ_ENABLE : 0x04,
    IRQ_MODE1 : 0x05,
    IRQ_MODE2 : 0x06,
    HW_KEY : 0x07,
    MEAS_RATE : 0x08,
    ALS_RATE : 0x09,
    PS_RATE : 0x0A,
    ALS_LOW_TH0 : 0x0B,
    ALS_LOW_TH1 : 0x0C,
    ALS_HI_TH0 : 0x0D,
    ALS_HI_TH1 : 0x0E,
    PS_LED21 : 0x0F,
    PS_LED3 : 0x10,
    PS1_TH0 : 0x11,
    PS1_TH1 : 0x12,
    PS2_TH0 : 0x13,
    PS2_TH1 : 0x14,
    PS3_TH0 : 0x15,
    PS3_TH1 : 0x16,
    PARAM_WR : 0x17,
    COMMAND : 0x18,
    RESPONSE : 0x20,
    IRQ_STATUS : 0x21,
    ALS_VIS_DATA0 : 0x22,
    ALS_VIS_DATA1 : 0x23,
    ALS_IR_DATA0 : 0x24,
    ALS_IR_DATA1 : 0x25,
    PS1_DATA0 : 0x26,
    PS1_DATA1 : 0x27,
    PS2_DATA0 : 0x28,
    PS2_DATA1 : 0x29,
    PS3_DATA0 : 0x2A,
    PS3_DATA1 : 0x2B,
    AUX_DATA0 : 0x2C,
    AUX_DATA1 : 0x2D,
    PARAM_RD : 0x2E,
    CHIP_STAT : 0x30,
    ANA_IN_KEY : 0x3B
};

var ramAddress = {
    I2C_ADDR : 0x00,
    CHLIST : 0x01,
    PSLED12_SELECT : 0x02,
    PSLED3_SELECT : 0x03,
    PS_ENCODING : 0x05,
    ALS_ENCODING : 0x06,
    PS1_ADCMUX : 0x07,
    PS2_ADCMUX : 0x08,
    PS3_ADCMUX : 0x09,
    PS_ADC_COUNTER : 0x0A,
    PS_ADC_GAIN : 0x0B,
    PS_ADC_MISC : 0x0C,
    ALS_IR_ADCMUX : 0x0E,
    AUX_ADCMUX : 0x0F,
    ALS_VIS_ADC_COUNTER : 0x10,
    ALS_VIS_ADC_GAIN : 0x11,
    ALS_VIS_ADC_MISC : 0x12,
    ALS_HYST : 0x16,
    PS_HYST : 0x17,
    PS_HISTORY : 0x18,
    ALS_HISTORY : 0x19,
    ADC_OFFSET : 0x1A,
    LED_REC : 0x1C,
    ALS_IR_ADC_COUNTER : 0x1D,
    ALS_IR_ADC_GAIN : 0x1E,
    ALS_IR_ADC_MISC : 0x1F,
    NOP_cmd : 0x00,
    RESET_cmd : 0x01,
    BUSADDR_cmd : 0x02,
    PS_FORCE_cmd : 0x05,
    ALS_FORCE_cmd : 0x06,
    PSALS_FORCE_cmd : 0x07,
    PS_PAUSE_cmd : 0x09,
    ALS_PAUSE_cmd : 0x0A,
    PSALS_PAUSE_cmd : 0x0B,
    PS_AUTO_cmd : 0x0D,
    ALS_AUTO_cmd : 0x0E,
    PSALS_AUTO_cmd : 0x0F,
};

var IR_ADDRESS	= 0x5A;

I2C1.setup({ sda: 10, scl: 9 });

function read_reg(address, len){
    I2C1.writeTo(IR_ADDRESS,address);
    return I2C1.readFrom(IR_ADDRESS, len);
}

function write_reg(address, val){
    I2C1.writeTo(IR_ADDRESS,[address,val]);
}

function read_light() { // return promiss
    write_reg(regAddress.COMMAND, ramAddress.ALS_FORCE_cmd);
    var promise = new Promise(function(resolve, reject) {
      setTimeout(function() {
        let LowB = read_reg(regAddress.ALS_VIS_DATA0,1);
        let HighB = read_reg(regAddress.ALS_VIS_DATA1,1);
        let result = (HighB << 8) | LowB;
        resolve(result);
      },5);
    });
    return promise;
 }
 
function param_set(address, val){
    write_reg(regAddress.PARAM_WR, val);
    write_reg(regAddress.COMMAND, 0xA0|address);
}


function bias(){
    for (var i=0; i<20; i++){
        write_reg(regAddress.COMMAND,ramAddress.PS_FORCE_cmd);
    }
}

void bias(void){  // Bias during start up
  
    for (int i=0; i<20; i++){
      write_reg(COMMAND,PS_FORCE_cmd);
      delay(50);
    
      byte LowB = read_reg(PS1_DATA0,1);
      byte HighB = read_reg(PS1_DATA1,1);
    
      bias1 += ((HighB << 8) | LowB) / 20;
    
      LowB = read_reg(PS2_DATA0,1);
      HighB = read_reg(PS2_DATA1,1);
    
      bias2 += ((HighB << 8) | LowB) / 20;
    
      LowB = read_reg(PS3_DATA0,1);
      HighB = read_reg(PS3_DATA1,1);
    
      bias3 += ((HighB << 8) | LowB) / 20;
   }

function setup(){
    write_reg(regAddress.HW_KEY, 0x17); // Setting up LED Power to full
    write_reg(regAddress.PS_LED21,0xFF);
    write_reg(regAddress.PS_LED3, 0x0F);
    param_set(ramAddress.CHLIST,0b00000001);
    param_set(ramAddress.PSLED12_SELECT,0b00000011);
    param_set(ramAddress.PS_ADC_GAIN,0b00000000);
    param_set(ramAddress.PS_ADC_MISC,0b00000100);
    let parameter = read_reg(regAddress.PARAM_RD,1);
}

function readHR() { // return promiss
    write_reg(regAddress.COMMAND, 0b00000101);
    var promise = new Promise(function(resolve, reject) {
      setTimeout(function() {
        let LowB = read_reg(regAddress.PS1_DATA0,1); // Read the data for the first LED
        let HighB = read_reg(regAddress.PS1_DATA1,1);
        PS1 = ((HighB * 255) + LowB);       // - bias1;
        resolve(PS1);
      },5);
    });
    return promise;
 }

// calcHR();
setup();
readHR().then(function(done) {
    console.log(done); // --> 'done!'
  });