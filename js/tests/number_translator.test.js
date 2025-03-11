// usage: `./qjs ./number_translator.test.js`

import { NumberTranslator } from '../number_translator.js'
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

// Create a dummy env object with schema config
const env = {
  engine: {
    schema: {
      config: {
        getString: (path) => '^R'
      }
    }
  }
}
const seg = { start: 0, end: 0 }

// Test 1: Init and finit functions
console.log('Test: Init and finit functions')
const numberTranslator = new NumberTranslator(env)
numberTranslator.finalizer(env)
console.log('---------------------------------------')

// Test 3: Basic number translations
console.log('Test: Basic number translations')
let input = 'R123'
let result = numberTranslator.translate(input, seg, env)
assertEquals(result[0].text, '一百二十三', '〔数字小写〕')
assertEquals(result[1].text, '壹佰贰拾叁', '〔数字大写〕')
assertEquals(result[2].text, '一百二十三元整', '〔金额小写〕')
assertEquals(result[3].text, '壹佰贰拾叁元整', '〔金额大写〕')

input = 'R0'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[0].text, '〇', 'Zero should be handled in lowercase')
assertEquals(result[1].text, '零', 'Zero should be handled in uppercase')
assertEquals(result[2].text, '〇元', 'Zero should be handled in lowercase')
assertEquals(result[3].text, '零元', 'Zero should be handled in uppercase')
console.log('---------------------------------------')

// Test 4: Decimal number translations
console.log('Test: Decimal number translations')
input = 'R123.45'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[0].text, '一百二十三点四五', 'Decimal numbers should be handled in lowercase')
assertEquals(result[1].text, '壹佰贰拾叁点肆伍', 'Decimal numbers should be handled in uppercase')
assertEquals(result[2].text, '一百二十三元四角五分', 'Currency format should be correct in lowercase')
assertEquals(result[3].text, '壹佰贰拾叁元肆角伍分', 'Currency format should be correct in uppercase')
console.log('---------------------------------------')

// Test 5: Large number translations
console.log('Test: Large number translations')
input = 'R1234567'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[0].text, '一百二十三万四千五百六十七', 'Large numbers should handle wan correctly')
assertEquals(result[1].text, '壹佰贰拾叁萬肆仟伍佰陆拾柒', 'Large numbers should handle wan correctly in uppercase')
assertEquals(result[2].text, '一百二十三万四千五百六十七元整', 'Large numbers should handle wan correctly')
assertEquals(result[3].text, '壹佰贰拾叁萬肆仟伍佰陆拾柒元整', 'Large numbers should handle wan correctly in uppercase')

input = 'R1234567890'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[0].text.includes('亿'), true, 'Billions should be handled correctly')
assertEquals(result[1].text.includes('億'), true, 'Billions should be handled correctly in uppercase')
console.log('---------------------------------------')

// Test 6: Special cases
console.log('Test: Special cases')
input = 'R0.00'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[2].text, '〇元', 'Zero amount should show as round number')
assertEquals(result[3].text, '零元', 'Zero amount should show as round number in uppercase')

input = 'R10'
result = numberTranslator.translate(input, seg, env)
assertEquals(result[2].text, '十元整', 'Leading one in tens should be omitted')
assertEquals(result[3].text, '拾元整', 'Leading one in tens should be omitted in uppercase')
console.log('---------------------------------------')

// Test 7: Invalid inputs
console.log('Test: Invalid inputs')
input = 'X123' // Wrong prefix
result = numberTranslator.translate(input, seg, env)
assertEquals(result.length, 0, 'Wrong prefix should return empty array')

input = 'R' // Empty number
result = numberTranslator.translate(input, seg, env)
assertEquals(result.length, 0, 'Empty number should return empty array')

input = 'Rabc' // Non-numeric
result = numberTranslator.translate(input, seg, env)
assertEquals(result.length, 0, 'Non-numeric input should return empty array')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
