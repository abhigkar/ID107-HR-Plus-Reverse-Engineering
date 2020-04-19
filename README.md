# ID107-HR-Plus-Reverse-Engineering {Work In Progress}
Espruino on ID107 HR Plus watch 

#### ID107 HR Plus Pin Mapping: 
|  Pin Number | Peripheral  |   | Pin Number  |  Peripheral |   |Pin Number|   Peripheral|
| ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ |
| D0  |   |   | D12  |   |   | D23  |  TEST_PAD_1 Serial UART Tx |
|  D1 |   |   |  D13 |   |   |  D24 |  TEST_PAD_2  Serial UART Rx |
| D3  |  KX022_SDA |   | D14  |   |   |  D25 | VIBRATION (HIGH = ON)   |
| D4  |   |   | D15  | S263_SCL   |   |  D26 |   OLED_POWER_CONTROL (HIGH = ON)  |
| D5  |  KX022_SLC |   | D16  | S263_SDA  |   |  D27 | FLASH_MISO  |
|D6   |   |   |D17   | S263_RDY   |   | D28  | FLASH_CS  |
|  D7 |   |   |D18   | SI1143_LED   |   | D29  |  BATTERY_VOLTAGE |
|  D8 |   |   | D19  |OLED_CS    |   | D30  | OLED_CLK/FLASH_CLK   |
| D9  |   SI1143_SCL  |   |  D20 |  OLED_RST  |   | D31  |  OLED_MOSI 31/FLASH_MOSI |
| D10  |   SI1143_SDA |   | D21  |   |   |   |   |
| D11  |   |   |  D22 | OLED_DC  |    |   |   |


Flasing Espruino firmware in ID107 HR Plus:

A custom Espruino build [download](https://github.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/blob/master/Espruino/espruino_2v04.15_572.zip "download") is compiled for ID107HrPlus [[BOARD.PY](https://github.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/blob/master/Espruino/ID107.py "BOARD.PY")]. Remember that this build only contains teh application code and NOT the Espruino bootloader.

There was issue that the bootloader starts watchdog at each boot so you need to ping it from espruino or it will will reboot, so once you connect via webide you need to paste code like `setInterval(function(){poke32(0x40010600,0x6E524635);},1000)` to ping watchdog each second. otherwise you'll see periodical Espruino disconnects/reboots.

You should also running this code all the time, when tracker is powered on, otherwise bootloader will remove the Espruino from the tracker the enter in DFU mode.

SPI Flash is PN25F08B. Chip seems to be functionally identical with many of the more common Winbond W25 ones.

SPI Flash and OLED shares the common SPI line with different SS/Chip Selects.

### OLED Code


    function go(){
       require("Font6x12").add(Graphics);
       g.setFont6x12();
       g.clear();
       // write some text
       g.drawString("Hello World",0,0);
       // write to the screen
       g.flip(); 
    }
    // SPI
    SPI1.setup({mosi: D31,sck: D30});
    var g = require("ID107PlusOLED.js").connectSPI(SPI1, D22, D20, go, {cs: D19, pwr:D26});
    
    
