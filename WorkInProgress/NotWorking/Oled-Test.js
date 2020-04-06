var PWR_PIN = D26; 
pinMode(PWR_PIN, "output");
digitalWrite(PWR_PIN, 1);

var initCmds = new Uint8Array([ 0xAE, // 0 disp off
                                0xD5, // 1 clk div
                                0x80, // 2 suggested ratio
                                0xA8, 0x7F, // 3 set multiplex
                                0xD3, 0x62, // 5 display offset
                                0x40, // 7 start line
                                0xAD,0x8B, // 8 enable charge pump
                                0xA1, // 10 seg remap 1, pin header at the top
                                0xC8, // 11 comscandec, pin header at the top
                                0xDA,0x12, // 12 set compins
                                0x81,0x80, // 14 set contrast
                                0xD9,0x22, // 16 set precharge
                                0xDB,0x40, // 18 set vcom detect
                                0xA6, // 20 display normal (non-inverted)
                                0xAF // 21 disp on
                              ]);

var dc  = D22;
var rst = D20;
var cs  = D19;
var g   = Graphics.createArrayBuffer(128,64,1,{vertical_byte : true});
//var spi = new SPI();
SPI1.setup({mosi: D31 /* D1 */, sck:D30 /* D0 */});
digitalPulse(rst,0,10);
setTimeout(function() {
  digitalWrite(cs,0);
  digitalWrite(dc,0); // command
  SPI1.write(initCmds);
  digitalWrite(dc,1); // data
  digitalWrite(cs,10);
}, 50);
g.flip = function() { 
cs.reset();dc.reset();
SPI1.write([0x21,0,127,0x22,0,7]);
for (var i=0;i<4;i++) {
  SPI1.write(0xb0+i,0x00,0x12);
  dc.set();
  SPI1.write(Uint8Array(this.buffer,64*i,64));
  dc.reset();
}cs.set();
};
//function cmd(c){cs.reset();dc.reset();SPI1.write(c);cs.set();}
//function dispoff(){cmd(0xae);}
//function dispon(){cmd(0xaf);}
 g.drawString("Hello",0,0);
 g.drawString("ESPRUINO",10,10);
 g.flip();
 
 
