// usage: `./qjs ./calculator.test.js`

// @ts-nocheck

import { Calculator } from '../calculator.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment, quality) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.quality = quality || 1
}

// Create a dummy env object
const env = {}
const seg = { start: 0, end: 0 }

// Test 1: Init and finit functions
const calculator = new Calculator(env)
calculator.finalizer(env)
console.log('---------------------------------------')

// Test 2: Basic calculations
let input = '/calc1+1'
let result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '2', 'Basic addition should work')
assertEquals(result[1].text, '1+1=2', 'Should show expression with result')
console.log('---------------------------------------')

// Test 3: Constants (e and pi)
input = '/jse'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(2), '2.72', 'e constant should be approximately 2.72')

input = '/jspi'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(2), '3.14', 'pi constant should be approximately 3.14')
console.log('---------------------------------------')

// Test 4: Mathematical functions
// Test random
input = '/jsrandom(1,10)'
result = calculator.translate(input, seg, env)
const randomNum = parseInt(result[0].text)
assertEquals(randomNum >= 1 && randomNum <= 10, true, 'Random number should be between 1 and 10')

// Test deg and rad
input = '/jsdeg(pi)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '180.0', 'deg(pi) should be 180')

input = '/jsrad(180)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(5), '3.14159', 'rad(180) should be approximately pi')

// Test avg
input = '/jsavg(1,2,3,4,5)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '3', 'Average of 1,2,3,4,5 should be 3')

// Test var
input = '/jsvar(1,2,3,4,5)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '2.0', 'Variance of 1,2,3,4,5 should be 2')

// Test fact
input = '/jsfact(5)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '120', 'Factorial of 5 should be 120')

// Test Math operators
// Test sin, cos, tan
input = '/jssin(pi/2)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '1.0', 'sin(pi/2) should be 1')

input = '/jscos(pi)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '-1.0', 'cos(pi) should be -1')

input = '/jstan(pi/4)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '1.0', 'tan(pi/4) should be 1')

// Test sqrt and pow
input = '/jssqrt(16)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '4', 'sqrt(16) should be 4')

input = '/jspow(2,3)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '8', 'pow(2,3) should be 8')

// Test log and abs
input = '/jslog(e)'
result = calculator.translate(input, seg, env)
assertEquals(parseFloat(result[0].text).toFixed(1), '1.0', 'log(e) should be 1')

input = '/jsabs(-5)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '5', 'abs(-5) should be 5')

// Test floor, ceil, and round
input = '/jsfloor(3.7)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '3', 'floor(3.7) should be 3')

input = '/jsceil(3.2)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '4', 'ceil(3.2) should be 4')

input = '/jsround(3.5)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '4', 'round(3.5) should be 4')
console.log('---------------------------------------')

// Test 5: Error handling
input = '/jsinvalid+expression'
result = calculator.translate(input, seg, env)
assertEquals(result[0].comment, '解析失败: invalid is not defined', 'Should handle invalid expressions')

input = '/jsfact(-1)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, 'fact(-1)', 'Factorial of negative number should return null')
assertEquals(result[0].comment, '解析失败: 阶乘不能为负数', 'Factorial of negative number should return null')
console.log('---------------------------------------')

// Test 6: Input validation
input = 'not_a_calc_command'
result = calculator.translate(input, seg, env)
assertEquals(result.length, 0, 'Non-calculator commands should return empty array')

input = '/calc'
result = calculator.translate(input, seg, env)
assertEquals(result.length, 0, 'Empty calculator input should return empty array')
console.log('---------------------------------------')

// Test 7: Bracket calculations
input = '/calc(2+3)*4'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '20', 'Basic bracket calculation should work')
assertEquals(result[1].text, '(2+3)*4=20', 'Should show expression with brackets')

input = '/calc((2+3)*2)+5'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '15', 'Nested brackets calculation should work')
assertEquals(result[1].text, '((2+3)*2)+5=15', 'Should show expression with nested brackets')

input = '/calc(3+4)*(2-1)/(5-3)'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '3.5', 'Complex bracket calculation should work')
assertEquals(result[1].text, '(3+4)*(2-1)/(5-3)=3.5', 'Should show complex expression with brackets')

input = '/jssin(pi/2+pi/6)'
result = calculator.translate(input, seg, env)
assertEquals(
  parseFloat(result[0].text).toFixed(3),
  '0.866',
  'Trigonometric function with bracket calculation should work',
)

input = '/jssqrt(pow(3,2)+pow(4,2))'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '5', 'Nested function calls with brackets should work')
console.log('---------------------------------------')

input = '/js0.3-0.1'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '0.2', 'Float point subtraction should work')

input = '/js3.8*1.4'
result = calculator.translate(input, seg, env)
assertEquals(result[0].text, '5.32', 'Float point multiplication should work')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
