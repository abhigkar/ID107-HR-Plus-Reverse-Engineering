//ID107HR_Plus_OLED.cpp

require("Font6x12").add(Graphics);


var cs = D19;
var rst= D20;
var dc =  D22;
var pwr = D26;

var W = 64;
var H = 128;

var spi = new SPI();
spi.setup({mosi: D31,sck: D30,baud: 8000000});
var oled = Graphics.createArrayBuffer(H, W, 1, { vertical_byte: true });
oled.setFont4x4();
//begin
pwr.mode("output");
digitalWrite(pwr, 1);

dc.mode("output");
cs.mode("output");

rst.mode("output");
// digitalPulse()??
rst.write(1);
digitalPulse(rst,0,10);

/*digitalWrite(rst,1);
setTimeout(function(){},10);
digitalWrite(rst,0);
setTimeout(function(){},10);
digitalWrite(rst,1);
setTimeout(function(){},10);
*/
 var initCmds = new Uint8Array([0xAE,0xD5,0x50,0xD3,0x00,0x40|0x00,0xad,0x8b,0x32,0xA0|0x01,0xC8,0xDA,0x12,0x81,0xcf,0xD9,0x28,0xDB,0x35,0xA4,0xA6, 0xAF]);

 setTimeout(function () {
	digitalWrite(cs, 1);
	digitalWrite(dc, 0);
	digitalWrite(cs, 0);
	spi.write(initCmds);
	digitalWrite(cs, 1);
 },50);

oled.clear();

oled.drawString("ID107 HR Plus",0,0);


//flip
function flip(){
    //digitalWrite(cs, 1); // -> NOT Required
    digitalWrite(dc, 0);
    digitalWrite(cs, 0);
    spi.write([0x00,0x10,0x40]);
    digitalWrite(cs, 1);


    const height= H / 8;
    const width= W / 8;
    const m_row = 0;
    const m_col = W / 2;

    var p = 0;

    for (var i = 0; i < height; i++) {
        //digitalWrite(cs, 1); NOT Required
        digitalWrite(dc, 0);
        digitalWrite(cs, 0);
        spi.write([0xB0 + i + m_row,m_col & 0xf,0x10 | (m_col >> 4)]);
        digitalWrite(cs, 1);
        for(var j = 0; j < width; j++){
            for (var k = 0; k < width; k++, p++) {
                    spi.write(oled.buffer[p]);
            }
        }
    }
    pwr.reset();
}
