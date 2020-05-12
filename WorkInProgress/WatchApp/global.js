
let isLocal = true;
const globals = {
    moduleLocation  :   isLocal? 'https://raw.githubusercontent.com/abhigkar/ID107-HR-Plus-Reverse-Engineering/master/WorkInProgress/WatchApp/Devices/':'',
    appVersion      :   1.1,
    LCDJS           :   moduleLocation + 'oledDisplay.js',
    KX022JS         :   moduleLocation + 'kx022Acce.js',
    TOUCHJS         :   moduleLocation + 'IQS263.js',
    SPIFLASHJS      :   moduleLocation + 'PN25F08.js',
    HEARTJS         :   moduleLocation + 'Si114x.js',
};



exports = globals;

