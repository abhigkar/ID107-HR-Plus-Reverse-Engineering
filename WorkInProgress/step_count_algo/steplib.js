//https://github.com/nerajbobra/embedded_pedometer
const fs = require('fs');


const NUM_AUTOCORR_LAGS = 50;
const NUM_TUPLES = 80;
const SAMPLING_RATE = 20;
const WINDOW_LENGTH = NUM_TUPLES/SAMPLING_RATE;
var mag_sqrt  = [];
var autocorr_buff  = [];
var lpf  = [];
var deriv  = [];
var lpf_coeffs      = [-5,6,34,68,84,68,34,6,-5];
var deriv_coeffs    = [-6,31,0,-31,6];  


//FIR low pass filter
function lowpassfilt(mag_sqrt, lpf) {
    let temp_lpf;
    for (let n = 0; n < NUM_TUPLES; n++) {
        temp_lpf = 0;
        for (let i = 0; i < 9; i++) {
            if (n-i >= 0) {     //handle the case when n < filter length
                temp_lpf += lpf_coeffs[i]*mag_sqrt[n-i];
            }
        }
        lpf[n] = temp_lpf;
    }
}
//calculate and remove the mean
function remove_mean(lpf) {
    let sum = 0;
    for (let i = 0; i < NUM_TUPLES; i++) {
        sum += lpf[i];
    }
    sum = sum/(NUM_TUPLES);
    
    for (let i = 0; i < NUM_TUPLES; i++) {
        lpf[i] = lpf[i] - sum;
    }
    return lpf;
}

function autocorr(lpf, autocorr_buff) {
    let temp_ac;
    for (let lag = 0; lag < NUM_AUTOCORR_LAGS; lag++) {
        temp_ac = 0;
        for (let i = 0; i < NUM_TUPLES-lag; i++) {
            temp_ac += lpf[i]*lpf[i+lag];
        }
        autocorr_buff[lag] = temp_ac;
    }
}

//calculate deriviative via FIR filter
function derivative(autocorr_buff, deriv) {
    let temp_deriv = 0;
    for (let n = 0; n < NUM_AUTOCORR_LAGS; n++) {
        temp_deriv = 0;
        for (let i = 0; i < 5; i++) {
            if (n-i >= 0) {     //handle the case when n < filter length
                temp_deriv += deriv_coeffs[i]*autocorr_buff[n-i];
            }
        }
        deriv[n] = temp_deriv;
    }
}

//use the original autocorrelation signal to hone in on the
//exact peak index. this corresponds to the point where the points to the
//left and right are less than the current point
function get_precise_peakind(autocorr_buff, peak_ind) {
    let loop_limit = 0;
    if ((autocorr_buff[peak_ind] > autocorr_buff[peak_ind-1]) && (autocorr_buff[peak_ind] > autocorr_buff[peak_ind+1])) {
        //peak_ind is perfectly set at the peak. nothing to do
    }
    else if ((autocorr_buff[peak_ind] > autocorr_buff[peak_ind+1]) && (autocorr_buff[peak_ind] < autocorr_buff[peak_ind-1])) {
        //peak is to the left. keep moving in that direction
        loop_limit = 0;
        while ((autocorr_buff[peak_ind] > autocorr_buff[peak_ind+1]) && (autocorr_buff[peak_ind] < autocorr_buff[peak_ind-1]) && (loop_limit < 10)) {
            peak_ind = peak_ind - 1;
            loop_limit++;
        }
    }
    else {
        //peak is to the right. keep moving in that direction
        loop_limit = 0;
        while ((autocorr_buff[peak_ind] > autocorr_buff[peak_ind-1]) && (autocorr_buff[peak_ind] < autocorr_buff[peak_ind+1]) && (loop_limit < 10)) {
            peak_ind = peak_ind + 1;
            loop_limit++;
        }
    }
    return peak_ind;
}

//take a look at the original autocorrelation signal at index i and see if
//its a real peak or if its just a fake "noisy" peak corresponding to
//non-walking. basically just count the number of points of the
//autocorrelation peak to the right and left of the peak. this function gets
//the number of points to the right and left of the peak, as well as the delta amplitude

//uint8_t *neg_slope_count, int64_t *delta_amplitude_right, uint8_t *pos_slope_count, int64_t *delta_amplitude_left, 

function get_autocorr_peak_stats(autocorr_buff, peak_ind) {
    let neg_slope_count = delta_amplitude_right = pos_slope_count = delta_amplitude_left  = 0;
    //first look to the right of the peak. walk forward until the slope begins decreasing
    let  neg_slope_ind = peak_ind;
    let loop_limit    = NUM_AUTOCORR_LAGS-1;
    while ((autocorr_buff[neg_slope_ind+1] - autocorr_buff[neg_slope_ind] < 0) && (neg_slope_ind < loop_limit)) {
        neg_slope_count = neg_slope_count + 1;
        neg_slope_ind    = neg_slope_ind + 1;
    }
    
    //get the delta amplitude between peak and right trough
    delta_amplitude_right = autocorr_buff[peak_ind] - autocorr_buff[neg_slope_ind];
    
    //next look to the left of the peak. walk backward until the slope begins increasing
    let pos_slope_ind = peak_ind;
    loop_limit    = 0;
    while ((autocorr_buff[pos_slope_ind] - autocorr_buff[pos_slope_ind-1] > 0) && (pos_slope_ind > loop_limit)) {
        pos_slope_count = pos_slope_count + 1;
        pos_slope_ind    = pos_slope_ind - 1;
    }
    
    //get the delta amplitude between the peak and the left trough
    delta_amplitude_left = autocorr_buff[peak_ind] - autocorr_buff[pos_slope_ind];
    return {
        neg_slope_count:neg_slope_count, 
        delta_amplitude_right: delta_amplitude_right,
        pos_slope_count: pos_slope_count,
        delta_amplitude_left: delta_amplitude_left
    }
}

function count_steps(data){
    let temp_mag;
    for (i = 0; i < NUM_TUPLES; i++) {
        temp_mag = (data[i*3+0]*data[i*3+0] + data[i*3+1]*data[i*3+1] + data[i*3+2]*data[i*3+2]);
        mag_sqrt[i] = Math.sqrt(temp_mag);
    }
   
    //apply low pass filter to mag_sqrt, result is stored in lpf
    lowpassfilt(mag_sqrt, lpf);
  
    //remove mean from lpf, store result in lpf
    remove_mean(lpf);
   
    //do the autocorrelation on the lpf buffer, store the result in autocorr_buff
    autocorr(lpf, autocorr_buff);
    
    //get the derivative of the autocorr_buff, store in deriv
    derivative(autocorr_buff, deriv);
   
    //look for first zero crossing where derivative goes from positive to negative. that
    //corresponds to the first positive peak in the autocorrelation. look at two samples
    //instead of just one to maybe reduce the chances of getting tricked by noise
    let peak_ind = 0;
    //start index is set to 8 lags, which corresponds to a walking rate of 2.5Hz @20Hz sampling rate. its probably
    //running if its faster than this
    for (i = 8; i < NUM_AUTOCORR_LAGS; i++) {
        if ((deriv[i] > 0) && (deriv[i-1] > 0) && (deriv[i-2] < 0) && (deriv[i-3] < 0)) {
            peak_ind = i-1;
            break;
        }
    }
    
    //hone in on the exact peak index
    peak_ind = get_precise_peakind(autocorr_buff, peak_ind);
    
   

    let autucorr = get_autocorr_peak_stats(autocorr_buff, peak_ind);
   
    let neg_slope_count = autucorr.neg_slope_count;
    let delta_amplitude_right = autucorr.delta_amplitude_right;
    let pos_slope_count = autucorr.pos_slope_count;
    let delta_amplitude_left = autucorr.delta_amplitude_left;

    //now check the conditions to see if it was a real peak or not, and if so, calculate the number of steps
    let num_steps = 0;
    if ((pos_slope_count > 3) && (neg_slope_count > 3) && (delta_amplitude_right > 1512) && (delta_amplitude_left > 1512)) {
        //the period is peak_ind/sampling_rate seconds. that corresponds to a frequency of 1/period
        //with the frequency known, and the number of seconds is 4 seconds, you can then find out the number of steps
        num_steps = (SAMPLING_RATE*WINDOW_LENGTH)/peak_ind;
    } else {
        //not a valid autocorrelation peak
        num_steps = 0;
    }
    return num_steps;
}

let scale_factor = 55.3293;
let acc = [];
let temp; 
let i = 0;
fs.readFile('d.csv', 'utf8', function (err, fileData) {
    var csvRows = fileData.split(/\r?\n/);
    csvRows.forEach((element) => {
        let colData = element.split(",");

        temp = Math.round(parseFloat(colData[0])*scale_factor);
        acc[i++] = temp;
      
        temp     =  Math.round(parseFloat(colData[1])*scale_factor);
        acc[i++] = temp;
  
        temp     =  Math.round(parseFloat(colData[2])*scale_factor);
        acc[i++] = temp;
     
       
    });
   let data = [];
   let  num_segments       = 400/(SAMPLING_RATE*WINDOW_LENGTH);
   let num_steps          = 0;
   for (let i = 0; i < num_segments; i++) {
       for (let j = SAMPLING_RATE*WINDOW_LENGTH*i*3; j < SAMPLING_RATE*WINDOW_LENGTH*(i+1)*3; j++) {
           data[j-SAMPLING_RATE*WINDOW_LENGTH*i*3] = acc[j];
       }
       num_steps += count_steps(data);
   }
   console.log('num_steps: ',num_steps);
});


/*


*/