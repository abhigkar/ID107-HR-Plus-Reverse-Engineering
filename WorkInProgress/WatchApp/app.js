
E.enableWatchdog(100);
(function(){
  const Watch = require("id107");
  const clockApp = require("clockFace");
  const infoPage = require("infoPage");

  const TIMER_MAX = 60000;
  const pollInterval = 100; 
  const twistThreshold = 600;
  const SCREEN_TIMEOUT = 7000;

  let acc = { x: 0, y: 0, z: 0 };
  var twistTimer = 0;
  var twistTimeout = 1000;
  var twistMaxY = -600;
  var flipTimer = 0;
  var accMagSquared = 0;
  var stepCounterThresholdLow = (8192-80)*(8192-80);
  var stepCounterThresholdHigh = (8192+80)*(8192+80);
  var stepWasLow = false;
  global.stepCounter = 0;
  global.lcd = Watch.lcdDisplay;
  iqs = Watch.iqs;
  lcd.setContrast(10);
  clock = clockApp(lcd);
  info = infoPage();
  const pages = [];
  let sleeping = false;
  const sleep = () => {
      //resetAccel();
      lcd.displayOff();
      sleeping = true;
  };
  
  const wake = () => {
    flipTimer = 0;
    lcd.displayOn();
    sleeping = false;
  };
  const onTouch= (event) => {
    //console.log(event);
    
    if(event == false) return;
    wake();
    lcd.clearRect(0,0,63,20);
    lcd.setFont8x12();
    //console.log(">> ", event.leftFlick);
    if(event.flick == "LEFT") {
      lcd.drawString("Flick : Left", 5,10);
     }
    else if(event.flick == "RIGHT") {
      lcd.drawString("Flick : Right",5,10);
    }
    else if(event.tap == "DOWN"){
      lcd.drawString("TAP: D "+event.cords,5,10);
    }
    else if(event.tap =="UP"){
      lcd.drawString("TAP: U "+event.cords,5,10);
    }
    else if(event.tap =="MIDDLE"){
      lcd.drawString("TAP: M "+event.cords,5,10);
    }
    else if(event.tap == "HOME"){
      lcd.drawString("TAP: H ",5,10);
      digitalPulse(D25,1,100);
    }
    lcd.flip();
  };

  const ACCEL_THRESHOLD = 100;
  
 
  
  const resetAccel = () => {
      acc = Watch.accelerometer.readRaw();
  };
  
  const  checkTwist= ()=>{
    const data = Watch.accelerometer.readRaw();
    if(!data) return false;

    let newX = data.x;
    let newY = data.y;
    let newZ = data.x;
    let dy = newY-acc.y;
    acc.x = newX;
    acc.y = newY;
    acc.z = newZ;
    accMagSquared = acc.x*acc.x + acc.y*acc.y + acc.z*acc.z;//print(acc);
    if (accMagSquared < stepCounterThresholdLow)
      stepWasLow = true;
    else if ((accMagSquared > stepCounterThresholdHigh) && stepWasLow) {
      stepWasLow = false;
      stepCounter++;
    }
    if (twistTimer < TIMER_MAX)
      twistTimer += pollInterval;
    let tdy = dy;
    let tthresh = twistThreshold;
    if (tthresh<0) {
      tthresh = -tthresh;
      tdy = -tdy;
    }
    if (tdy>tthresh) twistTimer=0;
    if (tdy<-tthresh && twistTimer<twistTimeout && acc.y<twistMaxY) {
    twistTimer = TIMER_MAX; // ensure we don't trigger again until tdy>tthresh
      return true;
    }
    return false;
};

  const updateDevices = () => {
      if (checkTwist()) {
        wake();
      }
      else{
        flipTimer += pollInterval;
        if (flipTimer >= SCREEN_TIMEOUT) {
          sleep();
        }
      }
    };
  
  setInterval(updateDevices, 80);
  
  iqs.setTouchCallback(onTouch);
  iqs.start();
  })();