# ID107-HR-Plus-Reverse-Engineering {Work In Progress}
Espruino on ID107 HR Plus watch 

#### ID107 HR Plus Pin Mapping: 
|  Pin Number | Peripheral  |   | Pin Number  |  Peripheral |   |Pin Number|   Peripheral|
| ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ | ------------ |
| D0  |   |   | D12  |   |   | D23  |  TEST_PAD_1 Serial UART Tx |
|  D1 |   |   |  D13 |   |   |  D24 |  TEST_PAD_2  Serial UART Rx |
| D3  |  KX022_SDA |   | D14  |   |   |  D25 | VIBRATION (HIGH = ON)   |
| D4  |   |   | D15  | S263_SCL   |   |  D26 |   OLED_POWER_CONTROL (HIGH = ON)  |
| D5  |  KX022_SLC |   | D16  | S263_SDA  |   |  D27 |   |
|D6   |   |   |D17   | S263_RDY   |   | D28  |   |
|  D7 |   |   |D18   | SI1143_LED   |   | D29  |   |
|  D8 |   |   | D19  |OLED_CS    |   | D30  | OLED_CLK   |
| D9  |   SI1143_SCL  |   |  D20 |  OLED_RST  |   | D31  |  OLED_MOSI 31 |
| D10  |   SI1143_SDA |   | D21  |   |   |   |   |
| D11  |   |   |  D22 | OLED_DC  |    |   |   |


Flasing Espruino firmware in ID107 HR Plus:

A custom Espruino build [download](https://github.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/blob/master/Espruino/espruino_2v04.15_572.zip "download") is compiled for ID107HrPlus [[BOARD.PY](https://github.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/blob/master/Espruino/ID107.py "BOARD.PY")]. Remember that this build only contains teh application code and NOT the Espruino bootloader.

There was issue that the bootloader starts watchdog at each boot so you need to ping it from espruino or it will will reboot, so once you connect via webide you need to paste code like `setInterval(function(){poke32(0x40010600,0x6E524635);},1000)` to ping watchdog each second. otherwise you'll see periodical Espruino disconnects/reboots.

You should also running this code all the time, when tracker is powered on, otherwise bootloader will remove the Espruino from the tracker the enter in DFU mode.
