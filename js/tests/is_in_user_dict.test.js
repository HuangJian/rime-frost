// usage: `./qjs ./is_in_user_dict.test.js`

import { IsInUserDictFilter } from '../is_in_user_dict.js'
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
const marker = new IsInUserDictFilter(env)
console.log('---------------------------------------')

// Test 2: User phrase should be marked with *
let candidates = [new Candidate('user_phrase', 0, 1, 'test', '')]
let generator = marker.filter(makeIterator(candidates), env)
let result = getGeneratorYieldValues(generator)[0]
assertEquals(result.comment, '*', 'filter: user phrase should be marked with *')
console.log('---------------------------------------')

// Test 3: Sentence should be marked with ∞
candidates = [new Candidate('sentence', 0, 1, 'test sentence', '')]
generator = marker.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)[0]
assertEquals(result.comment, '∞', 'filter: sentence should be marked with ∞')
console.log('---------------------------------------')

// Test 4: Other types should not be marked
candidates = [new Candidate('other', 0, 1, 'test other', '')]
generator = marker.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)[0]
assertEquals(result.comment, '', 'filter: other types should not be marked')
console.log('---------------------------------------')

// Test 5: Multiple candidates of different types
candidates = [
  new Candidate('user_phrase', 0, 1, 'test1', ''),
  new Candidate('sentence', 0, 1, 'test2', ''),
  new Candidate('other', 0, 1, 'test3', ''),
]
generator = marker.filter(makeIterator(candidates), env)
let results = getGeneratorYieldValues(generator)
assertEquals(results[0].comment, '*', 'filter: first candidate (user_phrase) should be marked with *')
assertEquals(results[1].comment, '∞', 'filter: second candidate (sentence) should be marked with ∞')
assertEquals(results[2].comment, '', 'filter: third candidate (other) should not be marked')
console.log('---------------------------------------')

// Test 6: Existing comments should be overwritten
candidates = [
  new Candidate('user_phrase', 0, 1, 'test', 'existing'),
  new Candidate('sentence', 0, 1, 'test', 'existing'),
]
generator = marker.filter(makeIterator(candidates), env)
results = getGeneratorYieldValues(generator)
assertEquals(results[0].comment, '*', 'filter: existing comment should be replaced with *')
assertEquals(results[1].comment, '∞', 'filter: existing comment should be replaced with ∞')
console.log('---------------------------------------')

// Test 7: Empty candidates array should be returned as is
candidates = []
generator = marker.filter(makeIterator(candidates), env)
results = getGeneratorYieldValues(generator)
assertEquals(results.length, 0, 'filter: empty candidates array should be returned as is')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
