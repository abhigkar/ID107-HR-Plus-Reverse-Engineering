/* Copyright (c) 2014 Sam Sykes, Gordon Williams, Jonathan Richards.
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
   g.drawString("Hello World",0,0);
   // write to the screen
   g.flip(); 
}
// SPI
SPI1.setup({mosi: D31,sck: D30});
var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/OLED/ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});

```

*/

var C = {
    OLED_WIDTH                 : 128,
    OLED_HEIGHT                : 0x40,
};

// commands sent when initialising the display
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

function update(options) {
    if (options && options.height) {
        //initCmds[4] = options.height-1;
		//initCmds[13] = options.height==64 ? 0x12 : 0x02;
	}
	if (options && options.contrast) {
		initCmds[15] = options.contrast;
	}
}

exports.connectSPI = function(spi, dc,  rst, callback, options) {
    update(options);
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
        digitalWrite(dc, 0);
		if(cs) digitalWrite(cs, 0);
		spi.write([0x00,0x10,0x40]);
		if(cs) digitalWrite(cs, 1);


		const height= C.OLED_WIDTH / 8;
		const width= C.OLED_HEIGHT / 8;
		const m_row = 0;
		const m_col = C.OLED_HEIGHT / 2;


		var p = 0;

		for (var i = 0; i < height; i++) {
			//digitalWrite(cs, 1); NOT Required
			digitalWrite(dc, 0);
			if(cs) digitalWrite(cs, 0);
			spi.write([0xB0 + i + m_row,m_col & 0xf,0x10 | (m_col >> 4)]);
			if(cs) digitalWrite(cs, 1);
			spi.write(new Uint8Array(oled.buffer, i*64, 64));
		}
		pwr.set();
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
    };

    // set on
    oled.on = function() { 
      if (pwr) pwr.set();
    };
    
    // return graphics
    return oled;
};
