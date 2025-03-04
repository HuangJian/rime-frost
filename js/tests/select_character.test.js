// usage: `./qjs ./select_character.test.js`

import * as select_character from '../select_character.js'
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

// Create a dummy env object with engine and config
const env = {
  engine: {
    commitText: (text) => console.log(`Mock committing text: ${text}`),
    schema: {
      config: {
        getString: (key) => {
          const config = {
            'key_binder/select_first_character': 'bracketleft',
            'key_binder/select_last_character': 'bracketright'
          }
          return config[key]
        }
      }
    },
    context: {
      clear: () => console.log('Mock clearing context'),
      isComposing: () => true,
      hasMenu: () => true,
      lastSegment: {
        selectedCandidate: {
          text: '测试'
        }
      }
    }
  }
}

// Test 1: Init with valid key configuration
select_character.init(env)
console.log('---------------------------------------')

// Test 2: Process key events for multi-character text
let keyEvent = { repr: KeyRepr.bracketleft, release: false }
let result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kAccepted, 'First character selection should be accepted')

keyEvent = { repr: KeyRepr.bracketright, release: false }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kAccepted, 'Last character selection should be accepted')
console.log('---------------------------------------')

// Test 3: Process key events for single character text
env.engine.context.lastSegment.selectedCandidate.text = '字'
keyEvent = { repr: KeyRepr.bracketleft, release: false }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kAccepted, 'Single character selection should be accepted')
console.log('---------------------------------------')

// Test 4: Process key events with no candidate
env.engine.context.lastSegment.selectedCandidate = null
env.engine.context.input = 'test'
keyEvent = { repr: KeyRepr.bracketleft, release: false }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kAccepted, 'Should use input when no candidate available')
console.log('---------------------------------------')

// Test 5: Process key events with empty input and no candidate
env.engine.context.lastSegment.selectedCandidate = null
env.engine.context.input = ''
keyEvent = { repr: KeyRepr.bracketleft, release: false }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kNoop, 'Should noop for empty input')
console.log('---------------------------------------')

// Test 6: Process key release events
env.engine.context.lastSegment.selectedCandidate = { text: '测试' }
keyEvent = { repr: KeyRepr.bracketleft, release: true }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kNoop, 'Should noop for key release events')
console.log('---------------------------------------')

// Test 7: Process when not composing and no menu
env.engine.context.isComposing = () => false
env.engine.context.hasMenu = () => false
keyEvent = { repr: KeyRepr.bracketleft, release: false }
result = select_character.process(keyEvent, env)
assertEquals(result, ProcessResult.kNoop, 'Should noop when not composing and no menu')
console.log('---------------------------------------')

// Test 8: Init with invalid key configuration
const invalidEnv = {
  engine: {
    schema: {
      config: {
        getString: () => null
      }
    }
  }
}

try {
  select_character.init(invalidEnv)
  console.log('Test failed: Should throw error for invalid key configuration')
} catch (error) {
  assertEquals(error.message, 'select_character.js init: 请配置按键', 'Should throw correct error for invalid keys')
}
console.log('---------------------------------------')

// Test finit function
select_character.finit(env)
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
