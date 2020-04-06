var log = console.log;
Modules.addCached("MYLCD", function () {
    // commands sent when initialising the display
    var initCmds = new Uint8Array([
                0xAE, // 0 disp off
                0xD5, // 1 clk div
                0x51, //0x50, // 2 suggested ratio
                0xA8, 63, // 3 set multiplex
                0xD3, 0x60, //0x0, // 5 display offset
                0x20, //??? //0x40, // 7 start line
                0xAD, 0x81, //0x8B, // 8 enable charge pump
                0xa0, //0xA1, // 10 seg remap 1, pin header at the top
                0xc0, //0xC8, // 11 comscandec, pin header at the top
                0xDA, 0x12, // 12 set compins
                0x81, 0x80, // 14 set contrast
                0xD9, 0x22, // 16 set precharge
                0xDB, 0x35, // 18 set vcom detect
                0xa4,
                0xA6, // 20 display normal (non-inverted)
                0x00, 0x10, 0xb0,
                0xAF // 21 disp on
            ]);
    exports.connectSPI = function (spi, dc, rst, callback, options) {
        var cs = options ? options.cs : undefined;
        var W = options && options.width ? options.width : 128;
        var H = options && options.height ? options.height : 64;
        initCmds[4] = H - 1;
        initCmds[13] = H == 64 ? 0x12 : 0x02;
        if (options && options.contrast) {
            initCmds[15] = options.contrast;
        }
        if (rst)
            rst.reset();
        var oled = Graphics.createArrayBuffer(H, W, 1, {
                vertical_byte: true
            });
        if (rst)
            digitalPulse(rst, 0, 30);
        setTimeout(function () {
            // configure the OLED
            D16.reset(); // HX03W oled power?
            if (cs)
                digitalWrite(cs, 0);
            digitalWrite(dc, 0); // command
            spi.write(initCmds);
            digitalWrite(dc, 1); // data
            if (cs)
                digitalWrite(cs, 1);
            // if there is a callback, call it now(ish)
            if (callback !== undefined)
                setTimeout(callback, 10);
        }, 50);
        oled.isOn = true;
        // write to the screen
        oled.flip = function () {
            //  16 pages x 64 bytes
            var page = 0xB0;
            if (cs)
                digitalWrite(cs, 0);
            for (var i = 0; page < 0xC0; i += H) {
                digitalWrite(dc, 0); // command
                spi.write([page, 0x0, 0x10]);
                page++;
                digitalWrite(dc, 1); // data
                spi.write(new Uint8Array(this.buffer, i, H));
            }
            if (cs)
                digitalWrite(cs, 1);
        };

        // set contrast, 0..255
        oled.setContrast = function (c) {
            if (cs)
                cs.reset();
            spi.write(0x81, c, dc);
            if (cs)
                cs.set();
        };

        // set off
        oled.off = function () {
            if (cs)
                cs.reset();
            spi.write(0xAE, dc);
            if (cs)
                cs.set();
            poke32(0x50000700 + 4 * 16, 2); // disconnect pin 16
            oled.isOn = false;
        };

        // set on
        oled.on = function () {
            D16.reset(); // pin 16 output low - power for oled
            if (cs)
                cs.reset();
            spi.write(0xAF, dc);
            if (cs)
                cs.set();
            oled.isOn = true;

        };

        // return graphics
        return oled;
    };
});

Modules.addCached("MODINIT", function () {

    exports.initOLED = function (rot, f) {
        require("Font8x12").add(Graphics);
        var spi = SPI1; //new SPI()
        spi.setup({
            mosi: D6,
            sck: D5,
            baud: 8000000
        });

        if (f === undefined)
            f = function () {
                o.setRotation(1, 0);
                o.clear();
                o.setFont8x12();
                o.drawString("Espruino on HX03W", 20, 24);
                o.flip();
            };
        var o = require("MYLCD").connectSPI(spi, D28, D4, f, {
                cs: D29
            });
        exports.OLED = o;
    };
});

var w = require("MODINIT");
w.initOLED(270);
var o = w.OLED;
