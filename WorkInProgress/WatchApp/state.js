const readEvent = ()=>{};
/*
Flick Right
new Uint8Array([0, 6]) new Uint8Array([3]) new Uint8Array([93])     //2
new Uint8Array([0, 102]) new Uint8Array(1) new Uint8Array([139])

FLICK Left
new Uint8Array([0, 6]) new Uint8Array([5]) new Uint8Array([244])    //4
new Uint8Array([0, 167]) new Uint8Array(1) new Uint8Array([61])

TAP - 1
new Uint8Array([0, 7]) new Uint8Array([5]) new Uint8Array([245])    //4
new Uint8Array([0, 39]) new Uint8Array(1) new Uint8Array([244])

TAP - 2
new Uint8Array([0, 6]) new Uint8Array([3]) new Uint8Array([63])     //2
new Uint8Array([0, 38]) new Uint8Array([1]) new Uint8Array([54])

TAP - 1&2
new Uint8Array([0, 6]) new Uint8Array([7]) new Uint8Array([97])     //6
new Uint8Array([0, 38]) new Uint8Array([1]) new Uint8Array([90])

TAP - HOME
new Uint8Array([0, 3]) new Uint8Array([9]) new Uint8Array([54])     //8
new Uint8Array([0, 35]) new Uint8Array(1) new Uint8Array([54])

new Uint8Array([0, 7]) new Uint8Array([3]) new Uint8Array([112])


*/
var currentState = 0;
const ops = ()=>{

    let evt = readEvent();
    if(evt == null || evt == undefined)
        return;
    
    if(currentState == 0){
        if(evt.touch) //2, 6 or 7
        {
            // home button??
            if(evt.slide || evt.FL || evt.FR){ // 6, 7
                currentState = 1;
            }
        }
        else if(evt.slide){ // only 4
            currentState = 1;
        }
        else{
            currentState = 0;
        }
    }

    if(currentState==1){
        
    }

    if(evt.FL){
        log("FLICK LEFT");
        currentState = 0;
    }
    else if(evt.FR){
        log("FLICK RIGHT");
        currentState = 0;
    }

    


};