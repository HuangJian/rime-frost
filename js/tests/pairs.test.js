// usage: `./qjs ./pairs.test.js`

import { PairsProcessor } from '../pairs.js'
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

let lastCommitText = ''
// Create a dummy env object with popen and engine context
const env = {
  popen: (command) => null,
  engine: {
    commitText: (text) => lastCommitText = text,
    context: {
      clear: () => null,
      hasMenu: () => true,
      isComposing: () => true,
      lastSegment: null,
    },
  },
}

// Create a dummy segment object
const seg = {
  start: 0,
  end: 0,
  candidateSize: 1,
  getCandidateAt: (idx) => new Candidate('symbol', 0, 0, '(', null),
}

// Test 1: Init and finit functions
const instance = new PairsProcessor(env)
instance.finalizer(env)
console.log('---------------------------------------')

// Test 2: Basic symbol pairing
env.engine.context.lastSegment = seg
let keyEvent = { repr: '1' } // Simulate selecting first candidate
let result = instance.process(keyEvent, env)
assertEquals(result, 'kAccepted', 'Should accept valid symbol pairing')
console.log('---------------------------------------')

// Test 3: Test different symbol pairs
const testPairs = [
  ['"', '"'],
  ["'", "'"],
  ['(', ')'],
  ['（', '）'],
  ['「', '」'],
  ['[', ']'],
  ['【', '】'],
  ['〔', '〕'],
  ['［', '］'],
  ['〚', '〛'],
  ['〘', '〙'],
  ['{', '}'],
  ['『', '』'],
  ['〖', '〗'],
  ['｛', '｝'],
  ['《', '》'],
]

testPairs.forEach(([left, right]) => {
  seg.getCandidateAt = () => new Candidate('symbol', 0, 0, left, null)
  result = instance.process(keyEvent, env)
  assertEquals(lastCommitText, left + right, `Should handle ${left}${right} pair correctly`)
  assertEquals(result, 'kAccepted', `Should kAccepted when ${left}${right} pair correctly`)
})
console.log('---------------------------------------')

// Test 4: Test with invalid context
env.engine.context.hasMenu = () => false
env.engine.context.isComposing = () => false
result = instance.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Should noop when no menu')
console.log('---------------------------------------')

// Test 5: Test with missing segment
env.engine.context.lastSegment = null
result = instance.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Should noop when no segment')
console.log('---------------------------------------')

// Test 6: Test with non-pairable symbol
seg.getCandidateAt = () => new Candidate('symbol', 0, 0, 'a', null)
env.engine.context.lastSegment = seg
result = instance.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Should noop for non-pairable symbol')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
