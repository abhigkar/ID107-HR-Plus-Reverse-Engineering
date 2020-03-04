/* Copyright (c) 2014 Sam Sykes, Gordon Williams, Jonathan Richards.
   See the file LICENSE for copying permission. */
/* 
Module for the SH1106 OLED controller

```
function go(){
   // write some text
   g.drawString("Hello World!",2,2);
   // write to the screen
   g.flip(); 
}

// I2C
I2C1.setup({scl:B6,sda:B7});
var g = require("SH1106").connect(I2C1, go, { address: 0x3C });

// SPI
SPI2.setup({mosi: B15, sck: B13});
var g = require("SH1106").connectSPI(SPI2, B14, B10, go, {cs: B1, height: 64});
```

*/

var C = {
    OLED_WIDTH                 : 128,
    OLED_CHAR                  : 0x40,
};

// commands sent when initialising the display
var initCmds = new Uint8Array([ 0xae,
0xa8,
0x3f,
0xd5,
0x51,
0xc0,
0xd3,
0x60,
0xdc,
0x00,
0x20,
0x81,
0x90,
0xa0,
0xa4,
0xa6,
0xad,
0x8a,
0xd9,
0x22,
0xdb,
0x35

                              ]);

function update(options) {
    if (options && options.height) {
        initCmds[4] = options.height-1;
		initCmds[13] = options.height==64 ? 0x12 : 0x02;
	}
	if (options && options.contrast) {
		initCmds[15] = options.contrast;
	}
}

exports.connect = function(i2c, callback, options) {
    update(options);
    var oled = Graphics.createArrayBuffer(C.OLED_WIDTH,(initCmds[4] + 1),1,{vertical_byte : true});
	var addr = 0x3C;
	if(options && options.address) addr = options.address;

    // configure the OLED
    initCmds.forEach(function(d) {i2c.writeTo(addr, [0,d]);});
    // if there is a callback, call it now(ish)
    if (callback !== undefined) setTimeout(callback, 10);
    
    // write to the screen
    oled.flip = function() { 
        // chip only has page mode
        var page = 0xB0;
        var chunk = new Uint8Array(C.OLED_WIDTH+1);

        chunk[0] = C.OLED_CHAR;
        for (var p=0; p<(C.OLED_WIDTH * initCmds[4] / 8); p+=C.OLED_WIDTH) {
			i2c.writeTo(addr, [0, page, 0x02, 0x10]);// display is centred in RAM
			page++;
            chunk.set(new Uint8Array(this.buffer,p,C.OLED_WIDTH), 1);
            i2c.writeTo(addr, chunk);
        } 
    };
    
	// set contrast, 0..255
	oled.setContrast = function(c) { i2c.writeTo(addr, 0, 0x81, c); };

    // set off
    oled.off = function() { i2c.writeTo(addr, 0, 0xAE); }

    // set on
    oled.on = function() { i2c.writeTo(addr, 0, 0xAF); }

    // return graphics
    return oled;
};
exports.connectSPI = function(spi, dc,  rst, callback, options) {
    update(options);
    var cs = options?options.cs:undefined;
    var oled = Graphics.createArrayBuffer(C.OLED_WIDTH,(initCmds[4] + 1),1,{vertical_byte : true});
    
    if (rst) digitalPulse(rst,0,10);
    setTimeout(function() {
        // configure the OLED
        if (cs) digitalWrite(cs,0);
        digitalWrite(dc,0); // command
        spi.write(initCmds);
        digitalWrite(dc,1); // data
        if (cs) digitalWrite(cs,1);
        // if there is a callback, call it now(ish)
        if (callback !== undefined) setTimeout(callback, 10);
    }, 50);
    
    // write to the screen
    oled.flip = function() { 
        //  chip only has page mode
        var page = 0xB0;
        var chunk = new Uint8Array(C.OLED_WIDTH);
        if (cs) digitalWrite(cs,0);
        for (var p=0; p<(C.OLED_WIDTH * initCmds[4] / 8); p+=C.OLED_WIDTH) {
            digitalWrite(dc,0); // command
            spi.write([page, 0x02, 0x10]);// display is centred in RAM
            page++;
	    console.log(this.buffer);
            digitalWrite(dc,1);// data
            chunk.set(new Uint8Array(this.buffer,p,C.OLED_WIDTH), 0);
            spi.write(chunk);
        }
        if (cs) digitalWrite(cs,1);
    };
    
	// set contrast, 0..255
	oled.setContrast = function(c) { 
		if (cs) cs.reset();
		spi.write(0x81,c,dc);
		if (cs) cs.set();
	};

    // set off
    oled.off = function() { 
      if (cs) cs.reset();
      spi.write(0xAE,dc);
      if (cs) cs.set();
    };

    // set on
    oled.on = function() { 
      if (cs) cs.reset();
      spi.write(0xAF,dc);
      if (cs) cs.set();
    };
    
    // return graphics
    return oled;
};
