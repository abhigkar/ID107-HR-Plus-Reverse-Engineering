/* Copyright (c) 2020 Abhinav Golwalkar 'abhinav.golwalkar@gmail.com'.
   See the file LICENSE for copying permission. */
/* 
Module for the Custom OLED controller for ID107 HR Plus fitness tracker

```
function go(){
   //set font
   require("Font6x12").add(Graphics);
   g.setFont6x12();
   //clear display 
   g.clear(); 
   // write some text
   g.drawString("OLED Display",0,3);
   g.drawString("Espruino",0,10);
   // write to the screen
   g.flip(); 
}
// SPI
SPI1.setup({mosi: D31,sck: D30});
var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/oledDisplay.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});

```

*/

var C = {
    OLED_WIDTH                 : 128,
    OLED_HEIGHT                : 64,
};

// commands sent when initialising the display
var initCmds = new Uint8Array([
                        0xAE ,		//		display off
                        0xA8,		//		Set Multiplex Ration cmd
                        0x3f,		//		Set Multiplex Ration val 0x3f
                        0xd5,		//		Set Display Clock Divide Ratio cmd
                        0x51,		//		Set Display Clock Divide Ratio val 
                        0xc0,		//		Set Common Output Scan Direction
                        0xd3,		//		Display Offset Mode Set cmd
                        0x60,		//		Display Offset Mode Set val ???
                        0xdc,
                        0x0,
                        0x20,
                        0x81, 		//		set Contrast cmd
                        0x21,		//		set Contrast val 
                        0xA0,		//		Set Segment Re-map (ADC) 
                        0xA4,		//		Set Entire Display OFF
                        0xA6,		//		Set Normal Display
                        0xAd,		//		DC-DC coverter cmd
                        0x8A,		//		DC-DC coverter Val off
                        0xD9,		//		Set Dis-charge/Pre-charge Period cmd
                        0x22,		//		Set Dis-charge/Pre-charge Period val
                        0xdb,		//		Set VCOM Deselect Level: cmd
                        0x35,		//		Set VCOM Deselect Level: val 
                        0xaf 		//		display on  
                ]);

exports.connectSPI = function(spi, dc,  rst, callback, options) {
	var pwr = options?options.pwr:undefined;
    var cs = options?options.cs:undefined;
    var oled = Graphics.createArrayBuffer(C.OLED_HEIGHT, C.OLED_WIDTH, 1, { vertical_byte: true });
	if(pwr){
		pwr.mode("output");
		digitalWrite(pwr, 1);
	}
	if(cs)
		cs.mode("output");

	dc.mode("output");	
    
    if (rst){
		rst.mode("output");
		rst.write(1);
		digitalPulse(rst,0,10);
	} 
    setTimeout(function() {
        if(cs) digitalWrite(cs, 1);
		digitalWrite(dc, 0);
		if(cs) digitalWrite(cs, 0);
		spi.write(initCmds);
		if(cs) digitalWrite(cs, 1);
        // if there is a callback, call it now(ish)
        if (callback !== undefined) setTimeout(callback, 10);
    }, 50);
    
    // write to the screen
    oled.flip = function() { 
        for (var i = 0; i < 16; i++) {
            digitalWrite(cs, 0);
			spi.write([0xB0 + i ,0x00,0x10],dc);
            digitalWrite(cs, 1);
			spi.write(new Uint8Array(oled.buffer, i*64, 64),dc);
		}
    };
    
	// set contrast, 0..255
	oled.setContrast = function(c) { 
		if (cs) cs.reset();
		spi.write(0x81,c,dc);
		if (cs) cs.set();
	};

    // set off
    oled.off = function() { 
      if (pwr) pwr.reset();
	  if (cs) cs.reset();
      spi.write([0xAD,0x8A,0xAE],dc);// set DC-DC converter off then display off
      if (cs) cs.set();
    };

    // set on
    oled.on = function() { 
      if (pwr) pwr.set();
      if (cs) cs.reset();
      spi.write([0xAD,0x8B,0xAF],dc);//set DC-DC converter on then display on
      if (cs) cs.set();
    };
    
    // return graphics
    return oled;
};
