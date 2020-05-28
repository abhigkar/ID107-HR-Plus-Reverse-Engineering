E.enableWatchdog(100);
(function(){
  const Watch = require("id107");
  const clockApp = require("clockFace");
  const infoPage = require("infoPage");


  global.lcd = Watch.lcdDisplay;
  iqs = Watch.iqs;
  lcd.setContrast(10);
  clock = clockApp(lcd);
  info = infoPage();
  const pages = []
  let sleeping = false;
  const sleep = () => {
      resetAccel();
      lcd.displayOff();
      sleeping = true;
  };
  
  const wake = () => {
    idleTimer = 0;
    lcd.displayOn();
    sleeping = false;
  };
  const onTouch= (event) => {
    //console.log(event);
    
    if(event == false) return;
    if(sleeping) wake();
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
  
  let prevAccel = { x: 0, y: 0, z: 0 };
  
  const resetAccel = () => {
      prevAccel = Watch.accelerometer.readRaw();
  };
  
  const checkAccel = () => {
      const data = Watch.accelerometer.readRaw();
      if(!data) return false;
      let axii = 0;
      if (Math.abs(prevAccel.x - data.x) > ACCEL_THRESHOLD) { axii++; }
      if (Math.abs(prevAccel.y - data.y) > ACCEL_THRESHOLD) { axii++; }
      if (Math.abs(prevAccel.z - data.z) > ACCEL_THRESHOLD) { axii++; }
      if (axii > 1) {
        prevAccel = data;
        return true;
      }
      return false;
  };
  const IDLE_TIMEOUT = 5000;
  let idleTimer = 0;
  const updateDevices = () => {
      if (checkAccel()) {
        wake();
      }
    else{
      idleTimer += 1000;
      if (idleTimer >= IDLE_TIMEOUT) {
        sleep();
      }
    }
    };
  
  setInterval(updateDevices, 1500);
  
  iqs.setTouchCallback(onTouch);
  iqs.start();
  })();