// usage: `./qjs ./shortcut.test.js`

import * as shortcut from '../shortcut.js'
import { KeyRepr, ProcessResult } from '../lib/rime.js'
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

// Create a dummy env object with popen and engine context
const env = {
  popen: (command) => console.log(`Mock executing command: ${command}`),
  engine: {
    context: {
      clear: () => console.log('Mock clearing context'),
      lastSegment: null,
    },
  },
}

// Create a dummy segment object
const seg = {
  start: 0,
  end: 0,
  prompt: '',
  candidateSize: 2,
  getCandidateAt: (idx) => {
    const candidates = [
      new Candidate('shortcut', 0, 0, '/deploy', 'Redeploy input method'),
      new Candidate('shortcut', 0, 0, '/screenshot', 'Take screenshot'),
    ]
    return candidates[idx]
  },
}

// Test 1: Init and finit functions
shortcut.init(env)
shortcut.finit(env)
console.log('---------------------------------------')

// Test 2: Basic shortcut translation
let input = '/deploy'
let result = shortcut.translate(input, seg, env)
assertEquals(result.length, 1, 'Should return one candidate for /deploy')
assertEquals(result[0].text, '/deploy', 'Should match /deploy command')
assertEquals(result[0].type, 'shortcut', 'Should be of type shortcut')
console.log('---------------------------------------')

// Test 3: Shortcut translation with partial input
input = '/scr'
result = shortcut.translate(input, seg, env)
assertEquals(result.length, 1, 'Should return one candidate for partial /screenshot')
assertEquals(result[0].text, '/screenshot', 'Should match /screenshot command')
console.log('---------------------------------------')

// Test 4: Invalid shortcut translation
input = 'not_a_shortcut'
result = shortcut.translate(input, seg, env)
assertEquals(result.length, 0, 'Should return empty array for non-shortcut input')

input = '/'
result = shortcut.translate(input, seg, env)
assertEquals(result.length, 0, 'Should return empty array for too short input')
console.log('---------------------------------------')

// Test 5: Process function with valid shortcut
let keyEvent = { repr: KeyRepr.Return }
seg.prompt = '〔快捷指令〕'
env.engine.context.lastSegment = seg

let processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kAccepted, 'Should accept valid shortcut command')
console.log('---------------------------------------')

// Test 6: Process function with number keys
keyEvent = { repr: '1' }
processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kAccepted, 'Should accept number key for first candidate')

keyEvent = { repr: '2' }
processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kAccepted, 'Should accept number key for second candidate')

keyEvent = { repr: '0' }
processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kNoop, 'Should noop for out of range candidate')
console.log('---------------------------------------')

// Test 7: Process function with invalid segment
env.engine.context.lastSegment = null
processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kNoop, 'Should noop when no valid segment')

env.engine.context.lastSegment = { prompt: 'Not a shortcut prompt' }
processResult = shortcut.process(keyEvent, env)
assertEquals(processResult, ProcessResult.kNoop, 'Should noop when not a shortcut prompt')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
