export function planksFromLogs(logs){
 if(!Number.isInteger(logs)||logs<0||logs>100000)throw new RangeError('Use 0–100,000 whole logs.');
 return logs*4;
}
