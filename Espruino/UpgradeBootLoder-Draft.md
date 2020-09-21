1- Flash NRF.Restart() patched Espruino for SDK11
2- Clear UICR
```
NRF.onRestart=function(){
poke32(0x4001e504,2);while(!peek32(0x4001e400)); // enable flash erase
poke32(0x4001e514,1);while(!peek32(0x4001e400)); // erase whole uicr
poke32(0x4001e504,0);while(!peek32(0x4001e400)); // disable flash writing
}
NRF.restart(); // will schedule SoftDevice restart after you disconnect
```

3- Disconnect and connect varify peek32(0x10001014).toString(16); that the UICR is cleared to all FFs.


4- Flash espruino booloader base64 [https://github.com/fanoush/ds-d6/blob/master/espruino/DFU/SDK12/bootloader-espruino-sd30-sdk12.zip] starting from address 0x78000
```
[a=$((0x78000));for i in `base64 -w96  sd_bl.bin` ; do echo "f(${a},atob('$i'));";a=$((a+72)) ; done]
```

5- verify bootloader (run f=verify and paste bootloader again)

6- erase last flash page to clear data stored by old bootloader
```
E.setFlags({unsafeFlash:1});
var f=require("Flash");
f.erasePage(0x7f000);
```

[AND f.erasePage(0x7e000); also???]

7- set UICR bootloader start and bootloader settings address - will enable new bootloader, again this needs disconnect and reconnect
```
NRF.onRestart=function(){
poke32(0x4001e504,1);while(!peek32(0x4001e400)); // enable flash writing
poke32(0x10001014,0x78000);while(!peek32(0x4001e400)); // set bootloader address 
poke32(0x10001018,0x7E000);while(!peek32(0x4001e400)); // set mbr settings
poke32(0x4001e504, 0);while(!peek32(0x4001e400)); // disable flash writing
}
NRF.restart();
```
8- reboot to newly flashed bootloder, it will stay in DFU mode, check for DfuTarg device
E.reboot();

9- Install Espruino for SDK12
