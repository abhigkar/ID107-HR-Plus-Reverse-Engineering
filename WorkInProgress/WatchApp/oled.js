require("Font8x12").add(Graphics);
require("GoodTime18x19").add(Graphics);
const initCmds = new Uint8Array([ 
    0xAE,0xA8,0x3f,0xd5,0x51,0xc0,0xd3,0x60,
    0xdc,0x0,0x20,0x81,0x21,0xA0,0xA4,0xA6,
    0xAd,0x8A,0xD9,0x22,0xdb,0x35,0xaf 
]);

let spi;
 
const width = 128;
const height = 64;
 

function init(cfg){
    let pwr = cfg.pwrPin;
    let cs = cfg.csPin;
    let dc = cfg.dcPin;
    let rst = cfg.rstPin;

    let oled = Graphics.createArrayBuffer(height, width, 1, { vertical_byte: true });
    spi = cfg.spi;

    pwr.mode("output");
    digitalWrite(pwr, 1);
    cs.mode("output");
    dc.mode("output"); 
    
    rst.mode("output");
    rst.write(1);
    digitalPulse(rst,0,10);

    setTimeout(function() {
        digitalWrite(cs, 1);
		digitalWrite(dc, 0);
		digitalWrite(cs, 0);
		spi.write(initCmds);
		digitalWrite(cs, 1);
    }, 50);    
    
    oled.displayOn= ()=>{
        pwr.set();
        cs.reset();
        spi.write([0xAD,0x8B,0xAF],dc);//set DC-DC converter on then display on
        cs.set();
    };
    oled.displayOff = ()=>{
        pwr.reset();
        cs.reset();
        spi.write([0xAD,0x8A,0xAE],dc);// set DC-DC converter off then display off
        cs.set();
    };
    oled.flip = ()=>{
        for (var i = 0; i < 16; i++) {
            digitalWrite(cs, 0);
            spi.write([0xB0 + i ,0x00,0x10],dc);
            digitalWrite(cs, 1);
            spi.write(new Uint8Array(oled.buffer, i*64, 64),dc);
        }
    };
    oled.flipPage = (start, end)=>{
        for (var i = start; i <= end; i++) {
            digitalWrite(cs, 0);
            spi.write([0xB0 + i ,0x00,0x10],dc);
            digitalWrite(cs, 1);
            spi.write(new Uint8Array(oled.buffer, i*64, 64),dc);
        }
    };
    oled.setContrast = (c)=>{
        cs.reset();
        spi.write([0x81,c],dc);
        cs.set();
    }
    oled.clear().flip();//clear the display;
    return oled;
}



module.exports  = init;