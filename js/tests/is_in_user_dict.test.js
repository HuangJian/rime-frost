// usage: `./qjs ./is_in_user_dict.test.js`

import * as marker from '../is_in_user_dict.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment, quality) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.quality = quality
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
marker.init()
console.log('---------------------------------------')

// Test 2: User phrase should be marked with *
let candidates = [new Candidate('user_phrase', 0, 1, 'test', '')]
let filtered = marker.filter(candidates, env)
let result = filtered[0]
assertEquals(result.comment, '*', 'filter: user phrase should be marked with *')
console.log('---------------------------------------')

// Test 3: Sentence should be marked with ∞
candidates = [new Candidate('sentence', 0, 1, 'test sentence', '')]
filtered = marker.filter(candidates, env)
result = filtered[0]
assertEquals(result.comment, '∞', 'filter: sentence should be marked with ∞')
console.log('---------------------------------------')

// Test 4: Other types should not be marked
candidates = [new Candidate('other', 0, 1, 'test other', '')]
filtered = marker.filter(candidates, env)
result = filtered[0]
assertEquals(result.comment, '', 'filter: other types should not be marked')
console.log('---------------------------------------')

// Test 5: Multiple candidates of different types
candidates = [
  new Candidate('user_phrase', 0, 1, 'test1', ''),
  new Candidate('sentence', 0, 1, 'test2', ''),
  new Candidate('other', 0, 1, 'test3', ''),
]
filtered = marker.filter(candidates, env)
assertEquals(filtered[0].comment, '*', 'filter: first candidate (user_phrase) should be marked with *')
assertEquals(filtered[1].comment, '∞', 'filter: second candidate (sentence) should be marked with ∞')
assertEquals(filtered[2].comment, '', 'filter: third candidate (other) should not be marked')
console.log('---------------------------------------')

// Test 6: Existing comments should be overwritten
candidates = [
  new Candidate('user_phrase', 0, 1, 'test', 'existing'),
  new Candidate('sentence', 0, 1, 'test', 'existing'),
]
filtered = marker.filter(candidates, env)
assertEquals(filtered[0].comment, '*', 'filter: existing comment should be replaced with *')
assertEquals(filtered[1].comment, '∞', 'filter: existing comment should be replaced with ∞')
console.log('---------------------------------------')

// Test 7: Empty candidates array should be returned as is
candidates = []
filtered = marker.filter(candidates, env)
assertEquals(filtered.length, 0, 'filter: empty candidates array should be returned as is')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
