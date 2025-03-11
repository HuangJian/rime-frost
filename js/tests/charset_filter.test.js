// usage: `./qjs ./charset_filter.test.js`

// @ts-nocheck

import { CharsetFilter } from '../charset_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

const instance = new CharsetFilter(null)

// Test filter function
const normalCJKCandidates = [{ text: '你好' }, { text: '世界' }]
let result = instance.filter(normalCJKCandidates, {})
assertEquals(result, normalCJKCandidates, 'should keep normal CJK characters')

const extACandidates = [{ text: 'ㄅㄆ' }]
result = instance.filter(extACandidates, {})
assertEquals(result, extACandidates, 'should keep CJK Extension A characters')

const extBCandidates = [{ text: '你好' }, { text: '𠀀' }, { text: '世界' }]
result = instance.filter(extBCandidates, {})
assertEquals(result, [{ text: '你好' }, { text: '世界' }], 'should filter out CJK Extension B characters')

const extCFCandidates = [
  { text: '你好' },
  { text: '𩸀' },
  { text: '𪠀' },
  { text: '𫠀' },
  { text: '𫰀' },
  { text: '世界' },
]
result = instance.filter(extCFCandidates, {})
assertEquals(result, [{ text: '你好' }, { text: '世界' }], 'should filter out CJK Extension C-F characters')

const mixedCandidates = [{ text: '你好𠀀' }, { text: '世界𩸀' }, { text: '测试' }]
result = instance.filter(mixedCandidates, {})
assertEquals(result, [{ text: '测试' }], 'should handle mixed visible and invisible characters')

result = instance.filter([], {})
assertEquals(result, [], 'should handle empty candidates array')

result = instance.filter([{ text: '' }], {})
assertEquals(result, [{ text: '' }], 'should handle empty strings')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
