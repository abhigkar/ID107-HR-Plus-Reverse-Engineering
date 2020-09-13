//var gbl = require("global.js");
const lcd = require("oled");
const accel = require("kx022");
const touch = require("iqs263v2");
//const heart = require(gbl.HEARTJS);
var pins = {
    KX022_SDA: D3,
    KX022_SLC: D5,
    KX022_EN: D6,

    SI1143_SCL: D9,
    SI1143_SDA: D10,

    S263_SCL: D15,
    S263_SDA: D16,
    S263_RDY: D17,
    
    VIB: D25,

    CHARG_L: D14,
    CHARG_H: D21,

    BATTERY: D29,

    OLED_PWR: D26,
    OLED_CS : D19,
    OLED_RST: D20,
    OLED_DC: D22,
    OLED_MX25_CLK: D30,
    OLED_MX25_MOSI: D31
};
pins.CHARG_L.mode('input_pullup');
pins.BATTERY.mode("analog");


var i2cAcce = new I2C();
i2cAcce.setup({scl:pins.KX022_SLC,sda:pins.KX022_SDA});

var i2cTouch = new I2C();
i2cTouch.setup({ scl : pins.S263_SCL, sda: pins.S263_SDA });

var spi = new SPI();
spi.setup({mosi: pins.OLED_MX25_MOSI,sck: pins.OLED_MX25_CLK});

const vibrate= (ms)=> digitalPulse(pins.VIB, 1, ms);
const isCharging = ()=> !pins.CHARG_L.read();

const accelerometer = accel({i2c:i2cAcce, enable: pins.KX022_EN});
const lcdDisplay = lcd({spi:spi, 
                        csPin: pins.OLED_CS, dcPin: pins.OLED_DC, 
                        rstPin: pins.OLED_RST, pwrPin: pins.OLED_PWR});
const iqs = touch({i2c:i2cTouch, rdyPin:pins.S263_RDY});


module.exports = {
    pins:pins,
    vibrate:vibrate,
    accelerometer: accelerometer,
    lcdDisplay: lcdDisplay,
    isCharging: isCharging,
    iqs: iqs,
};