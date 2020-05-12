/* Copyright (c) 2020 Abhinav Golwalkar. See the file LICENSE for copying permission. */
/*
PN25F08 8M-BIT SERIAL FLASH MEMORY

The datasheet for the B variant is not easily available, it is assumed it 
is the "plain" version with a different manufacturer. (Vendor code 0x5E 
for B version vs 0xE0 for the "plain" one.)

P25.js (Ths library is basedon W25.js[https://www.espruino.com/modules/W25.js])
========
https://github.com/abhigkar/ID107-HR-Plus-Reverse-Engineering

SPI Flash is PN25F08B. Chip seems to be functionally identical with many of the more common Winbond W25 ones.

Datasheet, http://www.xtxtech.com/upfile/2016082517095182.pdf


Examples:

const spi = new SPI();
spi.setup({ sck: D30, miso: D27, mosi: D31, mode:3});

var p25 = require("https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/Devices/PN25F08.js");
var myflash = new p25(spi, D28);
console.log(myflash.getJedec().manufacturerId);
console.log(myflash.getJedec().cap);
console.log(myflash.getJedec().deviceId);

*/

function PN25F08(spi, csPin) {
    this.spi = spi;
    this.csPin = csPin;
  }
  
  PN25F08.prototype.seek = function (pageNumber, offset) {
    // seeks to an address for sequential reading
    this.command(0x03);
    this.setAddress(pageNumber, offset);
    // stays selected until client finishes reading
  };
  
  PN25F08.prototype.read = function () {
    // reads a byte
    return this.spi.send(0);
  };
  
  PN25F08.prototype.waitReady = function () {
    // waits until chip is ready
    this.command(0x05);
    while (this.read() & 1);
    digitalWrite(this.csPin, 1);
  };
  
  PN25F08.prototype.eraseChip = function () {
    // overwrite whole chip with 0xFF
    this.command(0x06);
    this.command(0xC7);
    this.waitReady();
  };
  
  PN25F08.prototype.erase16Pages = function (pageNumber) {
    // overwrite 16 pages (of 256 bytes each) with 0xFF
    this.command(0x06);
    this.command(0x20);
    this.setAddress(pageNumber, 0);
    this.waitReady();
  };
  
  PN25F08.prototype.writePage = function (pageNumber, arrayBuffer) {
    // overwrites a page (256 bytes)
    // that memory MUST be erased first
    this.startWrite(pageNumber, 0);
    this.spi.write(arrayBuffer);
    this.finish();
  };
  
  PN25F08.prototype.writePageFillSpace = function (pageNumber, arrayBuffer) {
    // overwrites a page (256 bytes)
    // that memory MUST be erased first
    this.startWrite(pageNumber, 0);
    // for (var i = 0; i < arrayBuffer.length; i++)
    // this.write(arrayBuffer[i]);
    for (var i = 0; i < 256; i++) {
      if (i < arrayBuffer.length)
        this.write(arrayBuffer[i]);
      else
        this.write(' ');
    }
    this.finish();
  };
  
  PN25F08.prototype.writeSector = function (pageNumber, arrayBuffer) {
    // overwrites a sector (256*16 bytes)
    // that memory MUST be erased first
    // todo: check if arrayBuffer has 256*16 bytes
    for (p = 0; p < 16; p++) {
      pageToWrite = pageNumber + p;
      pageStart = p * 256;
      pageEnd = pageStart + 256;
      page = arrayBuffer.slice(pageStart, pageEnd);
      this.startWrite(pageToWrite, 0);
      this.spi.write(page);
      this.finish();
    }
  };
  
  PN25F08.prototype.startWrite = function (pageNumber, offset) {
    // seeks to address for sequential overwriting of memory
    // that memory MUST be erased first!
    // to end the operation, call finish
    this.command(0x06);
    this.command(0x02);
    this.setAddress(pageNumber, offset);
  };
  
  PN25F08.prototype.send = function (data) {
    // sends data and returns result
    return this.spi.send(data);
  };
  
  PN25F08.prototype.write = function (data) {
    // writes data without returning result
    this.spi.write(data);
  };
  
  PN25F08.prototype.finish = function () {
    // ends current operation, for example a sequential write
    digitalWrite(this.csPin, 1);
    this.waitReady();
  };
  
  PN25F08.prototype.getJedec = function () {
    // gets chips's JEDEC information
    this.command([0x9f, 0, 0, 0]);
    var res = {};
    res.manufacturerId = this.read();
    res.cap = this.read()* 16384;
    res.deviceId = this.read();
    digitalWrite(this.csPin, 1);
    return res;
  };

  
  PN25F08.prototype.command = function (cmd) {
    // for internal use only
    digitalWrite(this.csPin, 1);
    digitalWrite(this.csPin, 0);
    this.spi.write(cmd);
  };
  
  PN25F08.prototype.setAddress = function (pageNumber, offset) {
    // for internal use only
    this.spi.write([
      (pageNumber >> 8) & 0xFF,
      (pageNumber >> 0) & 0xFF,
      (offset >> 0) & 0xFF
    ]);
  };
  
  PN25F08.prototype.readPage = function (pageNumber) {
    this.seek(pageNumber, 0);
    return this.spi.send({ data: 0, count: 256 });
  }
  
  PN25F08.prototype.readSector = function (sector) {
    var pageNumber = sector * 16;
    this.seek(pageNumber, 0);
    return this.spi.send({ data: 0, count: 256 * 16 });
  }
  
  PN25F08.prototype.readPageString = function (page) {
    var x = "";
    this.seek(page, 0);
    for (i = 0; i < 256; i++) {
      x += String.fromCharCode(this.spi.send(0));
    }
    return x;
  }
  
  exports.connect = function (spi, csPin) {
    var flash = new PN25F08(spi, csPin);
    jedec = flash.getJedec();
    if ((jedec.manufacturerId != 0x5E) || (jedec.deviceId != 0x14)) flash = null;
    return flash;
  };
  
  exports = PN25F08;