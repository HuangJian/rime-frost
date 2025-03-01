import { unaccent, isChineseWord } from '../lib/string.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

assertEquals(unaccent(''), '', 'should handle empty string')

assertEquals(unaccent('hello world'), 'hello world', 'should not modify string without accents')

assertEquals(
  unaccent('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'),
  'aaaaeeeeiiiioooouuuuvvvvv',
  'should remove accents from vowels'
)

assertEquals(
  unaccent('hāo háo hǎo hào hao'),
  'hao hao hao hao hao',
  'should handle mixed accented and non-accented text'
)

assertEquals(
  unaccent('Hello, 你好!'),
  'Hello, 你好!',
  'should preserve non-vowel characters'
)

assertEquals(
  unaccent('hēēēēē'),
  'heeeee',
  'should handle repeated characters'
)

// Test isChineseWord function
assertEquals(isChineseWord(''), false, 'should return false for empty string')

assertEquals(isChineseWord('你好'), true, 'should return true for Chinese characters')
assertEquals(isChineseWord('世界'), true, 'should return true for Chinese characters')
assertEquals(isChineseWord('中文'), true, 'should return true for Chinese characters')

assertEquals(isChineseWord('hello'), false, 'should return false for non-Chinese characters')
assertEquals(isChineseWord('123'), false, 'should return false for non-Chinese characters')
assertEquals(isChineseWord('!@#'), false, 'should return false for non-Chinese characters')

assertEquals(
  isChineseWord('hello你好'),
  true,
  'should return true for mixed Chinese and non-Chinese text'
)
assertEquals(
  isChineseWord('123世界456'),
  true,
  'should return true for mixed Chinese and non-Chinese text'
)
assertEquals(
  isChineseWord('!中文#'),
  true,
  'should return true for mixed Chinese and non-Chinese text'
)

assertEquals(isChineseWord('ā'), false, 'should handle special Unicode characters correctly')
assertEquals(isChineseWord('あ'), false, 'should handle special Unicode characters correctly')
assertEquals(isChineseWord('カ'), false, 'should handle special Unicode characters correctly')
assertEquals(isChineseWord('한'), false, 'should handle special Unicode characters correctly')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
