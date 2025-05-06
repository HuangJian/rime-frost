// usage: `./qjs ./autocap_filter.test.js`
// @ts-nocheck

import { AutoCapFilter } from '../autocap_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'
import { makeIterator, getGeneratorYieldValues } from './generator.helper.js'

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
const filterInstance = new AutoCapFilter(env)
console.log('---------------------------------------')

// Test 2: Single character input should not be transformed
env.engine.context.input = 'h'
assertEquals(filterInstance.isApplicable(env), false, 'isApplicable: single character input should not be transformed')
let candidates = [new Candidate('abc', 0, 1, 'hello', '')]
let generator = filterInstance.filter(makeIterator(candidates), env)
let result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'hello', 'filter: single character input should not transform text')
console.log('---------------------------------------')

// Test 3: Input starting with lowercase should not transform
env.engine.context.input = 'he'
assertEquals(filterInstance.isApplicable(env), false, 'isApplicable: lowercase input should not be transformed')
candidates = [new Candidate('abc', 0, 2, 'hello', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'hello', 'filter: lowercase input should not transform text')
console.log('---------------------------------------')

// Test 4: First letter capitalization
env.engine.context.input = 'He'
assertEquals(filterInstance.isApplicable(env), true, 'isApplicable: first letter capitalization should be transformed')
candidates = [new Candidate('abc', 0, 2, 'hello', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'Hello', 'filter: first letter should be capitalized')
console.log('---------------------------------------')

// Test 5: All caps when input has 2+ uppercase letters
env.engine.context.input = 'HEl'
assertEquals(filterInstance.isApplicable(env), true, 'isApplicable: should transform to all caps when input has 2+ uppercase letters')
candidates = [new Candidate('abc', 0, 3, 'hello', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'HELLO', 'filter: should transform to all caps when input has 2+ uppercase letters')
console.log('---------------------------------------')

// Test 6: Input with punctuation
env.engine.context.input = 'He,'
assertEquals(filterInstance.isApplicable(env), true, 'isApplicable: should handle punctuation correctly')
candidates = [new Candidate('abc', 0, 3, 'hello,world', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'Hello,world', 'filter: should handle punctuation correctly')
console.log('---------------------------------------')

// Test 7: Candidate text with spaces
env.engine.context.input = 'He'
candidates = [new Candidate('abc', 0, 3, 'hello world', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'hello world', 'filter: should not transform text with spaces')
console.log('---------------------------------------')

// Test 8: Non-alphabetic characters
env.engine.context.input = 'He'
assertEquals(filterInstance.isApplicable(env), true, 'isApplicable: should handle non-alphabetic characters correctly')
candidates = [new Candidate('abc', 0, 2, 'hello123', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'Hello123', 'filter: should handle non-alphabetic characters correctly')
console.log('---------------------------------------')

// Test 9: Special Unicode characters
env.engine.context.input = 'He'
assertEquals(filterInstance.isApplicable(env), true, 'isApplicable: should handle special Unicode characters correctly')
candidates = [new Candidate('abc', 0, 2, 'hello世界', '')]
generator = filterInstance.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
assertEquals(result[0].text, 'hello世界', 'filter: should not transform text with special Unicode characters')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
