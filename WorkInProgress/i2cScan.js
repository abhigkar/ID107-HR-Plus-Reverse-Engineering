const scanI2C = (sda, scl) => {
    I2C1.setup({ sda: sda, scl: scl });
    for (let reg = 8; reg < 127; reg++) {
      try {
        I2C1.writeTo(reg, 0);
        I2C1.readFrom(reg, 1).forEach(val => {
          console.log('found i2c on scl', scl, 'sda', sda, 'reg', Number(reg).toString(16), 'reg0', val);
        });
      } catch (e) {
      }
    }
    Pin(scl).mode('input');
    Pin(sda).mode('input');
  };
  
  const pinScan = () => {
    const regs = [
      2, 3, 4, 5,  8, 9,
      10, 11, 12, 13, 14, 15, 16, 17, 18,
      21, 23, 24, 26, 27, 28, 29
    ];
    let a = 0;
    let b = 0;
    const int = setInterval(() => {
      if (a >= b) { console.log('.', b); b++; a = 0; }
      if (b >= regs.length) { console.log('done'); clearInterval(int); return; }
  
      if (a != b && a != undefined && b != undefined) {
        scanI2C(regs[a], regs[b]);
        scanI2C(regs[b], regs[a]);
      }
      a++;
    }, 1000);
  };