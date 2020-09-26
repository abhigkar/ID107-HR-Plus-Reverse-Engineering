Original work cradit @fanoush [https://github.com/fanoush]
https://github.com/fanoush/ds-d6/blob/master/espruino/DFU/DK08/README.md
https://github.com/fanoush/ds-d6/wiki/Replacing-Nordic-DFU-bootloader

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
```
E.setFlags({unsafeFlash:1});
var fl=require("Flash");
var ladd=0;var lpg=0;var nadd=0;// last address, last page addr, next addr
var flash=function(a,d){
  if (nadd>0 && nadd<a) console.log("Hole in data, got "+a.toString(16)+", expected "+nadd.toString(16));
  var p=fl.getPage(a).addr;
  if (p>lpg) {fl.erasePage(p);lpg=p;console.log("Erasing page 0x"+p.toString(16));}
  p=fl.getPage(a+d.length-1).addr;
  if (p>lpg) {fl.erasePage(p);lpg=p;console.log("Erasing page 0x"+p.toString(16));}
  if (a>ladd) {fl.write(d,a);ladd=a;nadd=a+d.length;}
  console.log(a.toString(16)+" F-OK")
}
var verify=function(a,d){
  if (typeof(d)=="string") d=E.toUint8Array(d);
  var m=fl.read(d.length,a)
  for (var i=0;i<d.length;i++,a++)
    if (m[i]!=d[i]) console.log(a.toString(16)+" V-FAIL");
  console.log(a.toString(16)+" V-OK");
}
var f=flash
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
