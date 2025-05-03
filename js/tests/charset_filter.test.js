// usage: `./qjs ./charset_filter.test.js`

// @ts-nocheck

import { CharsetFilter } from '../charset_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'
import { makeIterator, getGeneratorYieldValues } from './generator.helper.js'

const instance = new CharsetFilter(null)

// Test filter function
const normalCJKCandidates = [{ text: '你好' }, { text: '世界' }]
let filtered = instance.filter(makeIterator(normalCJKCandidates), {})
let result = getGeneratorYieldValues(filtered)
assertEquals(result[0], normalCJKCandidates[0], 'should keep normal CJK characters')

const extACandidates = [{ text: 'ㄅㄆ' }]
filtered = instance.filter(makeIterator(extACandidates), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], extACandidates[0], 'should keep CJK Extension A characters')

const extBCandidates = [{ text: '你好' }, { text: '𠀀' }, { text: '世界' }]
filtered = instance.filter(makeIterator(extBCandidates), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], { text: '你好' }, 'should filter out CJK Extension B characters')

const extCFCandidates = [
  { text: '你好' },
  { text: '𩸀' },
  { text: '𪠀' },
  { text: '𫠀' },
  { text: '𫰀' },
  { text: '世界' },
]
filtered = instance.filter(makeIterator(extCFCandidates), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], { text: '你好' }, 'should filter out CJK Extension C-F characters')

const mixedCandidates = [{ text: '你好𠀀' }, { text: '世界𩸀' }, { text: '测试' }]
filtered = instance.filter(makeIterator(mixedCandidates), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], { text: '测试' }, 'should handle mixed visible and invisible characters')

filtered = instance.filter(makeIterator([]), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], undefined, 'should handle empty candidates array')

filtered = instance.filter(makeIterator([{ text: '' }]), {})
result = getGeneratorYieldValues(filtered)
assertEquals(result[0], { text: '' }, 'should handle empty strings')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
