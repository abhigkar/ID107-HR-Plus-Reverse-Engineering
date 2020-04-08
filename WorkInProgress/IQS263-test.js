//IQS263-test.js

//INIT
var rdyPin = new Pin(17);
var sdaPin = D16;
var slcPin = D15;

var i2cAddr = 0x44;
var deviceInfo = 0x00;

rdyPin.mode("input");
sdaPin.mode("input");
slcPin.mode("input");


var i2c = new I2C();
i2c.setup({scl:slcPin,sda:sdaPin});

function CommsIQS_start(){
  while(rdyPin.read()){ //wait for the IQS to change from ready to not ready
  }
}

function CommsIQS_stop(){
  while(rdyPin.read()){ //wait for the IQS to change from ready to not ready
  }
  
  while(!rdyPin.read()){ //wait for the IQS to change from not ready to ready
  }
}


CommsIQS_start();
i2c.writeTo(i2cAddr, deviceInfo);
var data = i2c.readFrom({address: i2cAddr, stop:false},2);
CommsIQS_stop();

print(data[0].toString(16)+ "-"+ data[1].toString(16));

function watchFun(e){print(e.state);}
setWatch(watchFun, rdyPin, {repeat: falling, });

/*

rdyPin.mode("input_pullup");
setTimeout(()=>{},11);

rdyPin.mode("output");
digitalWrite(rdyPin,0);

setTimeout(()=>{},10);

i2c.writeTo(i2cAddr, deviceInfo);
var data = i2c.readFrom(i2cAddr,1);

rdyPin.mode("input_pullup");

print(data[0].toString(16));


*/


