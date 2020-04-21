function getRegAsync(reg){
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            i2c.writeTo(i2cAddr, reg);
            var data =  i2c.readFrom(i2cAddr,1);
            resolve(data);
        },10);
      });
      return promise;
}

function setRegAsync(reg, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [reg, val]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}

function readParamAsync(addr){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [COMMAND, (0x80 | addr)]);
        setTimeout(function() {
            getRegAsync(PARAM_RD).then((data)=>{
                resolve(data);
            });
        },10);
      });
      return promise;
}

function writeParamAsync(addr, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}
///////////////////////////////////////////////////////////////////////

//NO  ASYNC

function getReg(reg){
    i2c.writeTo(i2cAddr, reg);
    return i2c.readFrom(i2cAddr,1);
}

function setReg(reg, val){
    i2c.writeTo(i2cAddr, [reg, val]);
}

function readParam(addr){
    i2c.writeTo(i2cAddr, [COMMAND, (0x80 | addr)]);
    return getReg(PARAM_RD); 
}

function writeParam(addr, val){
    i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]);
}
///////////////////////////////////////////////////////////////////////////////////

//SINGLE WRITE

function getRegAsync(reg){
    var promise = new Promise(function(resolve, reject) {
        setTimeout(function() {
            i2c.writeTo(i2cAddr, reg);
            var data =  i2c.readFrom(i2cAddr,1);
            resolve(data);
        },10);
      });
      return promise;
}

function setRegAsync(reg, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [reg, val]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}

function readParamAsync(addr){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, COMMAND);
        i2c.writeTo(i2cAddr, (0x80 | addr));
        setTimeout(function() {
            getRegAsync(PARAM_RD).then((data)=>{
                resolve(data);
            });
        },10);
      });
      return promise;
}

function writeParamAsync(addr, val){
    var promise = new Promise(function(resolve, reject) {
        i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]);
        setTimeout(function() {
            resolve();
        },10);
      });
      return promise;
}
///////////////////////////////////////////////////////////////////////

//NO  ASYNC

function getReg(reg){
    i2c.writeTo(i2cAddr, reg);
    return i2c.readFrom(i2cAddr,1);
}

function setReg(reg, val){
    i2c.writeTo(i2cAddr, [reg, val]);
}

function readParam(addr){
    i2c.writeTo(i2cAddr, [COMMAND, (0x80 | addr)]);
    return getReg(PARAM_RD); 
}

function writeParam(addr, val){
    i2c.writeTo(i2cAddr, [PARAM_WR, val, (0xA0 | addr)]);
}
