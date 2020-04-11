//IQS263-test.js

//INIT
var rdyPin = new Pin(17);
var sdaPin = D16;
var slcPin = D15;

var i2cAddr = 0x44;
var deviceInfo = 0x00;

//rdyPin.mode("input");
//sdaPin.mode("input");
//slcPin.mode("input");


var i2c = new I2C();
i2c.setup({scl:slcPin,sda:sdaPin});



/*
var func = [
  ()=>{ 
    i2c.writeTo(i2cAddr, deviceInfo);
    var data = i2c.readFrom(i2cAddr,2);
    print(data[0].toString(16)+ "-"+ data[1].toString(16));
  },
  ()=>{print('Hello 2');},
  ()=>{print('Hello 3');},
  ];
  

  var countWatch  = 0;

  var initWatch = setWatch(function(e) { 
    // watchdog to prevent runaway
    if( countWatch >= 3 ) clearWatch(initWatch);
    countWatch++;
    if(func.length>0){
      (func.shift())();
    }
    }, rdyPin, { repeat:true, edge:'falling' }
  );
  */


/*CommsIQS_start();
i2c.writeTo(i2cAddr, deviceInfo);
var data = i2c.readFrom({address: i2cAddr, stop:false},2);
CommsIQS_stop();

print(data[0].toString(16)+ "-"+ data[1].toString(16));

function watchFun(e){print(e.state);}
setWatch(watchFun, rdyPin, {repeat: true, edge: 'falling' });
*/
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

function Event_Mode_HandShake(){
	/********************************************************
	 *			Try and do an Event Mode Handshake			*
	 *******************************************************/
	/*
	 *	There might be another way to build in the delay.
	 *	Event mode handshake is done by manually pulling
	 *	the IQS263 RDY line low for ~10ms and then releasing
	 *	it. This will tell the IQS263 that the Master wants
	 *	to talk and it will then give a Communications window
	 *	which will call the interrupt request function.
	 *	From there the IQS263 can be read again
	 */
	/*	Pull RDY low	*/
  rdyPin.mode("output");

  setTimeout(()=>{
    rdyPin.mode("input");
  },11)
   setTimeout(()=>{
    //data_buffer[0] = 0x00;//PROXSETTINGS0_VAL;
    //data_buffer[1] = (0x1D | 0x40);//(PROXSETTINGS1_VAL|EVENT_MODE);
    
    //PROX_SETTINGS 0x09
    //i2c_smbus_write_i2c_block_data(data->client, PROX_SETTINGS, 2,data_buffer);
    i2c.writeTo(i2cAddr, [0x09, 0x00,(0x1D | 0x40)]);
  },10);
}

function forceCommunication(cb){
  rdyPin.mode("output");
  digitalWrite(rdyPin,0);
  setTimeout(()=>{cb(null);},0);
}

function setProjectionMode(){
  SYS_FLAGS = 0x01;
  i2c.writeTo(i2cAddr, [SYS_FLAGS,0x00]);
}

Event_Mode_HandShake();
setProjectionMode();