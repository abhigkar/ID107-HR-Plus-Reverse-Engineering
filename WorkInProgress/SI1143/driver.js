var pins= [2,4,6,7,8,11,12,12,14,18,21,23,24,27,28,29]

pins.forEach((p)=>{digitalWrite(p,1);})
//https://github.com/goran-mahovlic/openwatch/blob/master/ID107HR_Plus/Arduino/libraries/SI114x/SI114x.cpp
const regParams = {
    PART_ID:0x00, REV_ID:0x01, SEQ_ID:0x02, INT_CFG: 0x03,
    IRQ_ENABLE:0x04, IRQ_MODE1: 0x05, IRQ_MODE2:0x06, HW_KEY:0x07,
    MEAS_RATE: 0x08, ALS_RATE:0x09, PS_RATE: 0x0A, ALS_LOW_TH: 0x0B,
    RESERVED_0C: 0x0C , ALS_HI_TH: 0x0D, RESERVED_0E: 0x0E, PS_LED21: 0x0F,
    PS_LED3: 0x10, PS1_TH: 0x11, RESERVED_12: 0x12, PS2_TH: 0x13,
    RESERVED_14: 0x14, PS3_TH: 0x15, RESERVED_16: 0x16, PARAM_WR: 0x17,
    COMMAND: 0x18, RESERVED_1F: 0x1F,
    RESPONSE: 0x20, IRQ_STATUS: 0x21, ALS_VIS_DATA0: 0x22, ALS_VIS_DATA1: 0x23,
    ALS_IR_DATA0: 0x24, ALS_IR_DATA1: 0x25, PS1_DATA0: 0x26, PS1_DATA1: 0x27,
    PS2_DATA0: 0x28, PS2_DATA1: 0x29, PS3_DATA0: 0x2A, PS3_DATA1: 0x2B,
    AUX_DATA0: 0x2C, AUX_DATA1: 0x2D, PARAM_RD: 0x2E, RESERVED_2F: 0x2F,
    CHIP_STAT: 0x30,  RESERVED_3A: 0x3A,
    ANA_IN_KEY1: 0x3B, ANA_IN_KEY2: 0x3C, ANA_IN_KEY3: 0x3D, ANA_IN_KEY4: 0x3E
};

const paramRAMValues = {
    PARAM_I2C_ADDR: 0x00,
    PARAM_CH_LIST: 0x01,
    PARAM_PSLED12_SELECT: 0x02,
    PARAM_PSLED3_SELECT: 0x03,
    PARAM_FILTER_EN: 0x04,
    PARAM_PS_ENCODING: 0x05,
    PARAM_ALS_ENCODING: 0x06,
    PARAM_PS1_ADCMUX: 0x07,
    PARAM_PS2_ADCMUX: 0x08,
    PARAM_PS3_ADCMUX: 0x09,
    PARAM_PS_ADC_COUNTER: 0x0A,
    PARAM_PS_ADC_CLKDIV: 0x0B,
    PARAM_PS_ADC_GAIN: 0x0B,
    PARAM_PS_ADC_MISC: 0x0C,
    PARAM_ALS1_ADC_MUX: 0x0D,
    PARAM_ALS2_ADC_MUX: 0x0E,
    PARAM_ALS3_ADC_MUX: 0x0F,
    PARAM_ALSVIS_ADC_COUNTER: 0x10,
    PARAM_ALSVIS_ADC_CLKDIV: 0x11,
    PARAM_ALSVIS_ADC_GAIN: 0x11,
    PARAM_ALSVIS_ADC_MISC: 0x12,
    PARAM_ALS_HYST: 0x16,
    PARAM_PS_HYST: 0x17,
    PARAM_PS_HISTORY: 0x18,
    PARAM_ALS_HISTORY: 0x19,
    PARAM_ADC_OFFSET: 0x1A,
    PARAM_SLEEP_CTRL: 0x1B,
    PARAM_LED_RECOVERY: 0x1C,
    PARAM_ALSIR_ADC_COUNTER: 0x1D,
    PARAM_ALSIR_ADC_CLKDIV: 0x1E,
    PARAM_ALSIR_ADC_GAIN: 0x1E,
    PARAM_ALSIR_ADC_MISC: 0x1F
};

const commandRegValues = {
    NOP_cmd: 0b00000000, // Forces a zero into the RESPONSE register
    RESET_cmd: 0b00000001, // Performs a software reset of the firmware
    BUSADDR_cmd: 0b00000010, // Modifies I2C address
    PS_FORCE_cmd: 0b00000101, // Forces a single PS measurement
    PSALS_FORCE_cmd: 0b00000111, // Forces a single PS and ALS measurement
    PS_PAUSE_cmd: 0b00001001, // Pauses autonomous PS
    ALS_PAUSE_cmd: 0b00001010, // Pauses autonomous ALS
    PSALS_PAUSE_cmd: 0b00001011, // Pauses PS and ALS
    PS_AUTO_cmd: 0b00001101, // Starts/Restarts an autonomous PS Loop
    ALS_AUTO_cmd: 0b00001110, // Starts/Restarts an autonomous ALS Loop
    PSALS_AUTO_Cmd: 0b00001111 // Starts/Restarts autonomous ALS and PS loop
};

//found i2c on scl 9 sda 10 reg 5a reg0 66
var address = 0x5a;
var device_id = 0x00;
I2C1.setup({ sda: 10, scl: 9 });

function isPresent(){
  var data = getReg(0x00,1);
  return data[0] == 0x42;
}
function getReg(reg, len){
  I2C1.writeTo(address, reg);
  return I2C1.readFrom(address, len);
}

function setReg(reg, val){
   I2C1.writeTo(address, [reg,val]);
}

function writeParam(reg, val){
    I2C1.writeTo(address, [regParams.PARAM_WR, val, 0xA0 | reg]);
}

function fetchLedData(){
    getReg(regParams.PS1_DATA0, 4);
}

function id()
{
    console.log("PART: ");
    console.log(getReg(regParams.PART_ID));
    console.log(" REV: ");
    console.log(getReg(regParams.REV_ID));
    console.log(" SEQ: ");
    console.log(getReg(regParams.SEQ_ID));
}



//initSensor()
function initSensor(){
    setReg(regParams.HW_KEY, 0x17);
    // pulsePlug.setReg(SI114x::COMMAND, SI114x::RESET_Cmd);
    //
    setReg(regParams.INT_CFG, 0x03);       // turn on interrupts
    setReg(regParams.IRQ_ENABLE, 0x10);    // turn on interrupt on PS3
    setReg(regParams.IRQ_MODE2, 0x01);     // interrupt on ps3 measurement
    setReg(regParams.MEAS_RATE, 0x84);     // 10ms measurement rate
    setReg(regParams.ALS_RATE, 0x08);      // ALS 1:1 with MEAS
    setReg(regParams.PS_RATE, 0x08);       // PS 1:1 with MEAS



    // Current setting for LEDs pulsed while taking readings
    // PS_LED21  Setting for LEDs 1 & 2. LED 2 is high nibble
    // each LED has 16 possible (0-F in hex) possible settings
    // see the SI114x datasheet.

    // These settings should really be automated with feedback from output
    // On my todo list but your patch is appreciated :)
    // support at moderndevice dot com.
    setReg(regParams.PS_LED21, 0x39);      // LED current for 2 (IR1 - high nibble) & LEDs 1 (red - low nibble)
    setReg(regParams.PS_LED3, 0x02);       // LED current for LED 3 (IR2)


    writeParam(regParams.PARAM_CH_LIST, 0x77);         // all measurements on

    // You can select which LEDs are energized for each reading.
    // The settings below (in the comments)
    // turn on only the LED that "normally" would be read
    // ie LED1 is pulsed and read first, then LED2 & LED3.
    writeParam(regParams.PARAM_PSLED12_SELECT, 0x21);  // 21 select LEDs 2 & 1 (red) only
    writeParam(regParams.PARAM_PSLED3_SELECT, 0x04);   // 4 = LED 3 only

    // Sensors for reading the three LEDs
    // 0x03: Large IR Photodiode
    // 0x02: Visible Photodiode - cannot be read with LEDs on - just for ambient measurement
    // 0x00: Small IR Photodiode
    writeParam(regParams.PARAM_PS1_ADCMUX, 0x03);      // PS1 photodiode select
    writeParam(regParams.PARAM_PS2_ADCMUX, 0x03);      // PS2 photodiode select
    writeParam(regParams.PARAM_PS3_ADCMUX, 0x03);      // PS3 photodiode select 

    writeParam(regParams.PARAM_PS_ADC_COUNTER, 0b01110000);    // 0b01110000 is default
    setReg(regParams.COMMAND,commandRegValues.PSALS_AUTO_Cmd);     // starts an autonomous read loop
}

//readPulseSensor()

function readPulseSensor(){

    
}