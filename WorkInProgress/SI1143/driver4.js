//https://github.com/Seeed-Studio/Grove_Sunlight_Sensor
//https://github.com/Seeed-Studio/Grove_Sunlight_Sensor/blob/master/SI114X.h
//https://github.com/Seeed-Studio/Grove_Sunlight_Sensor/blob/master/SI114X.cpp
//https://github.com/Seeed-Studio/Grove_Sunlight_Sensor/blob/master/examples/SI1145DEMO/SI1145DEMO.ino

//commands
var SI114X_QUERY = 0X80;
var SI114X_SET = 0XA0;
var SI114X_NOP = 0X0;
var SI114X_RESET = 0X01;
var SI114X_BUSADDR = 0X02;
var SI114X_PS_FORCE = 0X05;
var SI114X_GET_CAL = 0X12;
var SI114X_ALS_FORCE = 0X06;
var SI114X_PSALS_FORCE = 0X07;
var SI114X_PS_PAUSE = 0X09;
var SI114X_ALS_PAUSE = 0X0A;
var SI114X_PSALS_PAUSE = 0XB;
var SI114X_PS_AUTO = 0X0D;
var SI114X_ALS_AUTO = 0X0E;
var SI114X_PSALS_AUTO = 0X0F;

//IIC REGISTERS
var SI114X_PART_ID = 0X00;
var SI114X_REV_ID = 0X01;
var SI114X_SEQ_ID = 0X02;
var SI114X_INT_CFG = 0X03;
var SI114X_IRQ_ENABLE = 0X04;
var SI114X_IRQ_MODE1 = 0x05;
var SI114X_IRQ_MODE2 = 0x06;
var SI114X_HW_KEY = 0X07;
var SI114X_MEAS_RATE0 = 0X08;
var SI114X_MEAS_RATE1 = 0X09;
var SI114X_PS_RATE = 0X0A;
var SI114X_PS_LED21 = 0X0F;
var SI114X_PS_LED3 = 0X10;
var SI114X_UCOEFF0 = 0X13;
var SI114X_UCOEFF1 = 0X14;
var SI114X_UCOEFF2 = 0X15;
var SI114X_UCOEFF3 = 0X16;
var SI114X_WR = 0X17;
var SI114X_COMMAND = 0X18;
var SI114X_RESPONSE = 0X20;
var SI114X_IRQ_STATUS = 0X21;
var SI114X_ALS_VIS_DATA0 = 0X22;
var SI114X_ALS_VIS_DATA1 = 0X23;
var SI114X_ALS_IR_DATA0 = 0X24;
var SI114X_ALS_IR_DATA1 = 0X25;
var SI114X_PS1_DATA0 = 0X26;
var SI114X_PS1_DATA1 = 0X27;
var SI114X_PS2_DATA0 = 0X28;
var SI114X_PS2_DATA1 = 0X29;
var SI114X_PS3_DATA0 = 0X2A;
var SI114X_PS3_DATA1 = 0X2B;
var SI114X_AUX_DATA0_UVINDEX0 = 0X2C;
var SI114X_AUX_DATA1_UVINDEX1 = 0X2D;
var SI114X_RD = 0X2E;
var SI114X_CHIP_STAT = 0X30;

//

var SI114X_I2C_ADDR = 0X00;
var SI114X_CHLIST = 0X01;
var SI114X_CHLIST_ENUV = 0x80;
var SI114X_CHLIST_ENAUX = 0x40;
var SI114X_CHLIST_ENALSIR = 0x20;
var SI114X_CHLIST_ENALSVIS = 0x10;
var SI114X_CHLIST_ENPS1 = 0x01;
var SI114X_CHLIST_ENPS2 = 0x02;
var SI114X_CHLIST_ENPS3 = 0x04;
var SI114X_PSLED12_SELECT = 0X02;
var SI114X_PSLED3_SELECT = 0X03;
var SI114X_PS_ENCODE = 0X05;
var SI114X_ALS_ENCODE = 0X06;
var SI114X_PS1_ADCMUX = 0X07;
var SI114X_PS2_ADCMUX = 0X08;
var SI114X_PS3_ADCMUX = 0X09;
var SI114X_PS_ADC_COUNTER = 0X0A;
var SI114X_PS_ADC_GAIN = 0X0B;
var SI114X_PS_ADC_MISC = 0X0C;
var SI114X_ALS_IR_ADC_MUX = 0X0E;
var SI114X_AUX_ADC_MUX = 0X0F;
var SI114X_ALS_VIS_ADC_COUNTER = 0X10;
var SI114X_ALS_VIS_ADC_GAIN = 0X11;
var SI114X_ALS_VIS_ADC_MISC = 0X12;
var SI114X_LED_REC = 0X1C;
var SI114X_ALS_IR_ADC_COUNTER = 0X1D;
var SI114X_ALS_IR_ADC_GAIN = 0X1E;
var SI114X_ALS_IR_ADC_MISC = 0X1F;

//ADCMUX
var SI114X_ADCMUX_SMALL_IR = 0x00;
var SI114X_ADCMUX_VISIABLE = 0x02;
var SI114X_ADCMUX_LARGE_IR = 0x03;
var SI114X_ADCMUX_NO = 0x06;
var SI114X_ADCMUX_GND = 0x25;
var SI114X_ADCMUX_TEMPERATURE = 0x65;
var SI114X_ADCMUX_VDD = 0x75;
//LED SEL
var SI114X_PSLED12_SELECT_PS1_NONE = 0x00;
var SI114X_PSLED12_SELECT_PS1_LED1 = 0x01;
var SI114X_PSLED12_SELECT_PS1_LED2 = 0x02;
var SI114X_PSLED12_SELECT_PS1_LED3 = 0x04;
var SI114X_PSLED12_SELECT_PS2_NONE = 0x00;
var SI114X_PSLED12_SELECT_PS2_LED1 = 0x10;
var SI114X_PSLED12_SELECT_PS2_LED2 = 0x20;
var SI114X_PSLED12_SELECT_PS2_LED3 = 0x40;
var SI114X_PSLED3_SELECT_PS2_NONE = 0x00;
var SI114X_PSLED3_SELECT_PS2_LED1 = 0x10;
var SI114X_PSLED3_SELECT_PS2_LED2 = 0x20;
var SI114X_PSLED3_SELECT_PS2_LED3 = 0x40;
////ADC	GAIN	DIV
var SI114X_ADC_GAIN_DIV1 = 0X00;
var SI114X_ADC_GAIN_DIV2 = 0X01;
var SI114X_ADC_GAIN_DIV4 = 0X02;
var SI114X_ADC_GAIN_DIV8 = 0X03;
var SI114X_ADC_GAIN_DIV16 = 0X04;
var SI114X_ADC_GAIN_DIV32 = 0X05;
//LED	CURRENT
var SI114X_LED_CURRENT_5MA = 0X01;
var SI114X_LED_CURRENT_11MA = 0X02;
var SI114X_LED_CURRENT_22MA = 0X03;
var SI114X_LED_CURRENT_45MA = 0X04;
//Recovery	period	the	ADC

var SI114X_ADC_COUNTER_1ADCCLK = 0X00;
var SI114X_ADC_COUNTER_7ADCCLK = 0X01;
var SI114X_ADC_COUNTER_15ADCCLK = 0X02;
var SI114X_ADC_COUNTER_31ADCCLK = 0X03;
var SI114X_ADC_COUNTER_63ADCCLK = 0X04;
var SI114X_ADC_COUNTER_127ADCCLK = 0X05;
var SI114X_ADC_COUNTER_255ADCCLK = 0X06;
var SI114X_ADC_COUNTER_511ADCCLK = 0X07;
////ADC	MISC

var SI114X_ADC_MISC_LOWRANGE = 0X00;
var SI114X_ADC_MISC_HIGHRANGE = 0X20;
var SI114X_ADC_MISC_ADC_NORMALPROXIMITY = 0X00;
var SI114X_ADC_MISC_ADC_RAWADC = 0X04;
////INT	OE

var SI114X_INT_CFG_INTOE = 0X01;
//IRQ	ENABLE

var SI114X_IRQEN_ALS = 0x01;
var SI114X_IRQEN_PS1 = 0x04;
var SI114X_IRQEN_PS2 = 0x08;
var SI114X_IRQEN_PS3 = 0x10;

var i2cAddr = 0x5A;
var i2c = new I2C();
function Begin(){
    // create I2C and Init 
    i2c.setup({ sda: 10, scl: 9 });
    //
    //Init IIC  and reset si114x
    //
    if (ReadByte(SI114X_PART_ID) != 0X42) {
        return false;
    }
    reset();
    //
    //INIT
    //
    init();
    return true;
}

function init(){
    /*
    //ENABLE UV reading
    //these reg must be set to the fixed value
    WriteByte(SI114X_UCOEFF0, 0x29);
    WriteByte(SI114X_UCOEFF1, 0x89);
    WriteByte(SI114X_UCOEFF2, 0x02);
    WriteByte(SI114X_UCOEFF3, 0x00);
    WriteParamData(SI114X_CHLIST, SI114X_CHLIST_ENUV | SI114X_CHLIST_ENALSIR | SI114X_CHLIST_ENALSVIS |
                   SI114X_CHLIST_ENPS1);

    */
    //
    //set LED1 CURRENT(22.4mA)(It is a normal value for many LED)
    //
    WriteParamData(SI114X_PS1_ADCMUX, SI114X_ADCMUX_LARGE_IR);
    WriteByte(SI114X_PS_LED21, SI114X_LED_CURRENT_22MA);
    WriteParamData(SI114X_PSLED12_SELECT, SI114X_PSLED12_SELECT_PS1_LED1); //
    //
    //PS ADC SETTING
    //
    WriteParamData(SI114X_PS_ADC_GAIN, SI114X_ADC_GAIN_DIV1);
    WriteParamData(SI114X_PS_ADC_COUNTER, SI114X_ADC_COUNTER_511ADCCLK);
    WriteParamData(SI114X_PS_ADC_MISC, SI114X_ADC_MISC_HIGHRANGE | SI114X_ADC_MISC_ADC_RAWADC);
    //
    //VIS ADC SETTING
    //
    WriteParamData(SI114X_ALS_VIS_ADC_GAIN, SI114X_ADC_GAIN_DIV1);
    WriteParamData(SI114X_ALS_VIS_ADC_COUNTER, SI114X_ADC_COUNTER_511ADCCLK);
    WriteParamData(SI114X_ALS_VIS_ADC_MISC, SI114X_ADC_MISC_HIGHRANGE);
    //
    //IR ADC SETTING
    //
    WriteParamData(SI114X_ALS_IR_ADC_GAIN, SI114X_ADC_GAIN_DIV1);
    WriteParamData(SI114X_ALS_IR_ADC_COUNTER, SI114X_ADC_COUNTER_511ADCCLK);
    WriteParamData(SI114X_ALS_IR_ADC_MISC, SI114X_ADC_MISC_HIGHRANGE);
    //
    //interrupt enable
    //
    WriteByte(SI114X_INT_CFG, SI114X_INT_CFG_INTOE);
    WriteByte(SI114X_IRQ_ENABLE, SI114X_IRQEN_ALS);
    //
    //AUTO RUN
    //
    WriteByte(SI114X_MEAS_RATE0, 0xFF);
    WriteByte(SI114X_COMMAND, SI114X_PSALS_AUTO);
}

function delay(ms){
    //dummy function
}
function reset(){
    WriteByte(SI114X_MEAS_RATE0, 0);
    WriteByte(SI114X_MEAS_RATE1, 0);
    WriteByte(SI114X_IRQ_ENABLE, 0);
    WriteByte(SI114X_IRQ_MODE1, 0);
    WriteByte(SI114X_IRQ_MODE2, 0);
    WriteByte(SI114X_INT_CFG, 0);
    WriteByte(SI114X_IRQ_STATUS, 0xFF);
    WriteByte(SI114X_COMMAND, SI114X_RESET);

    delay(10);
    WriteByte(SI114X_HW_KEY, 0x17);
    delay(10);

}

function WriteByte(reg, val){
    i2c.writeTo(i2cAddr, reg, val);
}

function ReadByte(reg){
    i2c.writeTo(i2cAddr, reg);
    return i2c.readFrom(i2cAddr,1);
}

function ReadHalfWord(reg){
    i2c.writeTo(i2cAddr, reg);
    var data = i2c.readFrom(i2cAddr,2);
    return  data[0] | data[1] << 8;;
}

function ReadParamData(reg){
    WriteByte(SI114X_COMMAND, reg | SI114X_QUERY);
    return ReadByte(SI114X_RD);
}

function WriteParamData(reg, val){
      //write Value into PARAMWR reg first
      WriteByte(SI114X_WR, val);
      WriteByte(SI114X_COMMAND, reg | SI114X_SET);
      //SI114X writes value out to PARAM_RD,read and confirm its right
      return ReadByte(SI114X_RD);
}

function ReadVisible(){
    return ReadHalfWord(SI114X_ALS_VIS_DATA0);
}

function ReadIR(){
    return ReadHalfWord(SI114X_ALS_IR_DATA0);
}

/*function ReadProximity(PSn){
    return ReadHalfWord(PSn);
}

function ReadUV(){
    return (ReadHalfWord(SI114X_AUX_DATA0_UVINDEX0));
}

*/

if(!Begin()){
    console.log("Error");
}
else{
    var counter = 0;
    D18.set();
    var intVal = setInterval(()=>{
        if(counter > 30){
            clearInterval(intVal);
            D18.reset();
        }
        console.log("Vis: " , ReadVisible());
        console.log("IR: ", ReadIR());
        counter++;
    },200);
}