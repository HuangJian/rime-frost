export function assertEquals(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
        throw("FAIL: " + msg + "\n  Expected: " + b + "\n  Actual:  " + a);
     } else {
        console.log("PASS: " + msg);
    }
}
