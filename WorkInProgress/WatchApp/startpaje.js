function go(){
    //set font
    require("Font8x12").add(Graphics);
    g.setFont8x12();
    //clear display 
    g.clear(); 
    // write some text
    g.drawString("OLED Display",0,3);
    g.drawString("Espruino",0,10);
    // write to the screen
    g.flip(); 
 }
 // SPI
 var spi = new SPI();
 spi.setup({mosi: D31,sck: D30});
 var g = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/oledDisplay.js").connectSPI(spi, D22, D20, go, {cs: D19, pwr:D26});
 
 
 var s = require("Storage");
 var watch = eval(s.read("watch.icon"));
 g.clear();
 g.drawImage(watch,10,10);
 g.drawString("ID107HRPlus",2,83);
 g.drawString("Espruino",10,95);
 g.drawString(process.env.VERSION,10,110);
 g.flip();
 