//ID107HR_Plus_OLED.cpp

require("Font6x12").add(Graphics);


var cs = D19;
var rst= D20;
var dc =  D22;
var pwr = D26;

var W = 128;
var H = 64;

var spi = new SPI();
spi.setup({mosi: D31,sck: D30,baud: 8000000});
var oled = Graphics.createArrayBuffer(H, W, 1, { vertical_byte: true });
oled.setFont6x12();
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
var initCmds = new Uint8Array([
                0xAE,//DISPLAYOFF 
                0xD5, //SETDISPLAYCLOCKDIV 
                0x80,
                0xA8,//SETMULTIPLEX 
                127,//_display_height - 1
                0xD3,//SETDISPLAYOFFSET
                0x00,
                0x40,//SETSTARTLINE
                0x8D,//CHARGEPUMP
                0x14,
                0x20,//MEMORYMODE 
                0x00,
                0xA1,//SEGREMAP 
                0xC8,//COMSCANDEC
                0xDA,//SETCOMPINS 
                0x12,
                0x81,//SETCONTRAST 
                0xCF,
                0xD9,//SETPRECHARGE 
                0x1F,
                0xDB,//SETVCOMDETECT 
                0x40,
                0xA4,//DISPLAYALLON_RESUME 
                0xA6,//NORMALDISPLAY
                0x2,//DEACTIVATESCROLL
                0xAF//DISPLAYON 
  ]);
 setTimeout(function () {
	digitalWrite(cs, 1);
	digitalWrite(dc, 0);
	digitalWrite(cs, 0);
	spi.write(initCmds);
	digitalWrite(cs, 1);
 },50);




//flip
function flip(){
    //digitalWrite(cs, 1); // -> NOT Required
    digitalWrite(dc, 0);
    digitalWrite(cs, 0);
    spi.write([0x00,0x10,0x40]);
    digitalWrite(cs, 1);


    const height= W / 8;
    const width= H / 8;
    const m_row = 0;
    const m_col = H / 2;


    var p = 0;

    for (var i = 0; i < height; i++) {
        //digitalWrite(cs, 1); NOT Required
        digitalWrite(dc, 0);
        digitalWrite(cs, 0);
        spi.write([0xB0 + i + m_row,m_col & 0xf,0x10 | (m_col >> 4)]);
        digitalWrite(cs, 1);
        spi.write(new Uint8Array(oled.buffer, i*64, 64));
    }
    pwr.set();
}
oled.clear();
oled.drawString("ID107 HR Plus",0,0);
flip();