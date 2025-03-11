// usage: `./qjs ./slash.test.js`

// @ts-nocheck

import { SlashProcessor } from '../slash.js'
import { KeyRepr } from '../lib/rime.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Mock objects and environment setup
const mockCandidate = {
  text: '/',
}

const mockSegment = {
  selectedIndex: 0,
  candidateSize: 4,
  getCandidateAt: () => mockCandidate
}

const mockContext = {
  hasMenu: () => true,
  isComposing: () => true,
  lastSegment: mockSegment
}

const mockEngine = {
  context: mockContext,
  processKey: (direction) => {
    mockSegment.lastProcessedDirection = direction
  }
}

const env = {
  engine: mockEngine
}

// Test 1: Init and finit functions
const slash = new SlashProcessor(env)
slash.finalizer(env)
console.log('Test 1: Init and finit functions - Passed')
console.log('---------------------------------------')

// Test 2: Process non-slash key
let keyEvent = { repr: 'a' }
let result = slash.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Non-slash key should return kNoop')
console.log('Test 2: Process non-slash key - Passed')
console.log('---------------------------------------')

// Test 3: Process slash key with first candidate being '/'
keyEvent = { repr: KeyRepr.slash }
mockSegment.selectedIndex = 0
result = slash.process(keyEvent, env)
assertEquals(result, 'kAccepted', 'Slash key with first candidate being "/" should return kAccepted')
assertEquals(mockSegment.lastProcessedDirection, KeyRepr.Down, 'Direction should be Down when at first candidate')
console.log('Test 3: Process slash key with first candidate - Passed')
console.log('---------------------------------------')

// Test 4: Process slash key at last candidate
keyEvent = { repr: KeyRepr.slash }
mockSegment.selectedIndex = mockSegment.candidateSize - 1
result = slash.process(keyEvent, env)
assertEquals(result, 'kAccepted', 'Slash key at last candidate should return kAccepted')
assertEquals(mockSegment.lastProcessedDirection, KeyRepr.Up, 'Direction should be Up when at last candidate')
console.log('Test 4: Process slash key at last candidate - Passed')
console.log('---------------------------------------')

// Test 5: Process slash key with no menu
mockContext.hasMenu = () => false
mockContext.isComposing = () => false
keyEvent = { repr: KeyRepr.slash }
result = slash.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Slash key with no menu should return kNoop')
console.log('Test 5: Process slash key with no menu - Passed')
console.log('---------------------------------------')

// Test 6: Process slash key with different first candidate
mockContext.hasMenu = () => true
mockCandidate.text = 'not-slash'
keyEvent = { repr: KeyRepr.slash }
result = slash.process(keyEvent, env)
assertEquals(result, 'kNoop', 'Slash key with different first candidate should return kNoop')
console.log('Test 6: Process slash key with different first candidate - Passed')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
