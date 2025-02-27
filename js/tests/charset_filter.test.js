import { init, finit, filter } from '../charset_filter.js'
import { assert, assertEquals, totalTests, passedTests } from './testutil.js'

// Store original console.log
const originalLog = console.log
let logCalls = []

// Test init and finit
console.log = (...args) => logCalls.push(args[0])
init({})
assert(logCalls[0] === 'charset_filter init', 'init should log initialization message')

logCalls = []
finit({})
assert(logCalls[0] === 'charset_filter finit', 'finit should log finalization message')

// Restore console.log for test output
console.log = originalLog

// Test filter function
const normalCJKCandidates = [
  { text: '你好' },
  { text: '世界' },
]
let result = filter(normalCJKCandidates, {})
assertEquals(result, normalCJKCandidates, 'should keep normal CJK characters')

const extACandidates = [{ text: 'ㄅㄆ' }]
result = filter(extACandidates, {})
assertEquals(result, extACandidates, 'should keep CJK Extension A characters')

const extBCandidates = [
  { text: '你好' },
  { text: '𠀀' },
  { text: '世界' },
]
result = filter(extBCandidates, {})
assertEquals(
  result,
  [{ text: '你好' }, { text: '世界' }],
  'should filter out CJK Extension B characters'
)

const extCFCandidates = [
  { text: '你好' },
  { text: '𩸀' },
  { text: '𪠀' },
  { text: '𫠀' },
  { text: '𫰀' },
  { text: '世界' },
]
result = filter(extCFCandidates, {})
assertEquals(
  result,
  [{ text: '你好' }, { text: '世界' }],
  'should filter out CJK Extension C-F characters'
)

const mixedCandidates = [
  { text: '你好𠀀' },
  { text: '世界𩸀' },
  { text: '测试' },
]
result = filter(mixedCandidates, {})
assertEquals(
  result,
  [{ text: '测试' }],
  'should handle mixed visible and invisible characters'
)

result = filter([], {})
assertEquals(result, [], 'should handle empty candidates array')

result = filter([{ text: '' }], {})
assertEquals(result, [{ text: '' }], 'should handle empty strings')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
