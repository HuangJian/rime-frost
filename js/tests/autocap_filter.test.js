// usage: `./qjs ./autocap_filter.test.js`

import * as autocap from '../autocap_filter.js'
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

// Create a dummy env object for init and filter calls
const env = {
  engine: {
    context: {
      input: '',
    },
  },
}

// Test 1: Init function logs correctly
autocap.init()
console.log('---------------------------------------')

// Test 2: Single character input should not be transformed
env.engine.context.input = 'h'
let candidates = [new Candidate('abc', 0, 1, 'hello', '')]
let filtered = autocap.filter(candidates, env)
let result = filtered[0]
assertEquals(result.text, 'hello', 'filter: single character input should not transform text')
console.log('---------------------------------------')

// Test 3: Input starting with lowercase should not transform
env.engine.context.input = 'he'
candidates = [new Candidate('abc', 0, 2, 'hello', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'hello', 'filter: lowercase input should not transform text')
console.log('---------------------------------------')

// Test 4: First letter capitalization
env.engine.context.input = 'He'
candidates = [new Candidate('abc', 0, 2, 'hello', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'Hello', 'filter: first letter should be capitalized')
console.log('---------------------------------------')

// Test 5: All caps when input has 2+ uppercase letters
env.engine.context.input = 'HEl'
candidates = [new Candidate('abc', 0, 3, 'hello', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'HELLO', 'filter: should transform to all caps when input has 2+ uppercase letters')
console.log('---------------------------------------')

// Test 6: Input with punctuation
env.engine.context.input = 'He,'
candidates = [new Candidate('abc', 0, 3, 'hello,world', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'Hello,world', 'filter: should handle punctuation correctly')
console.log('---------------------------------------')

// Test 7: Input with spaces
env.engine.context.input = 'He '
candidates = [new Candidate('abc', 0, 3, 'hello world', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'hello world', 'filter: should not transform text with spaces')
console.log('---------------------------------------')

// Test 8: Non-alphabetic characters
env.engine.context.input = 'He'
candidates = [new Candidate('abc', 0, 2, 'hello123', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'Hello123', 'filter: should handle non-alphabetic characters correctly')
console.log('---------------------------------------')

// Test 9: Special Unicode characters
env.engine.context.input = 'He'
candidates = [new Candidate('abc', 0, 2, 'hello世界', '')]
filtered = autocap.filter(candidates, env)
result = filtered[0]
assertEquals(result.text, 'hello世界', 'filter: should not transform text with special Unicode characters')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
