// usage: `./qjs ./lunar_translator.test.js`

import { LunarTranslator } from '../lunar_translator.js'
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
        getString: function(key) {
          return 'nl' // Default key for lunar date input
        }
      }
    }
  },
  namespace: ''
}
const seg = { start: 0, end: 0 }

// Test 1: Init and finit functions
console.log('Test 1: Testing init and finit functions')
const lunar = new LunarTranslator(env)
lunar.finalizer(env)
console.log('---------------------------------------')

// Test 2: Current date conversion
console.log('Test 2: Testing current date conversion')
let input = 'nl' // Default key for current date
let result = lunar.translate(input, seg, env)
assertEquals(result.length, 3, 'Should return three date format candidates')
assertEquals(typeof result[0].text, 'string', 'Simple format should be string')
assertEquals(typeof result[1].text, 'string', 'Traditional format should be string')
assertEquals(typeof result[2].text, 'string', 'Full format should be string')
console.log('---------------------------------------')

// Test 3: Specific date conversion
console.log('Test 3: Testing specific date conversion')
input = 'nl20240210' // 2024年2月10日, 农历甲辰年正月初一
result = lunar.translate(input, seg, env)
assertEquals(result.length, 3, 'Should return three date format candidates')
assertEquals(result[0].text, '二〇二四年正月初一', 'Simple format should match')
assertEquals(result[1].text, '甲辰年正月初一', 'Traditional format should match')
assertEquals(result[2].text, '甲辰年（龙）正月初一', 'Full format should match')
console.log('---------------------------------------')

// Test 4: Invalid date handling
console.log('Test 4: Testing invalid date handling')
input = 'nl99999999' // Invalid date
result = lunar.translate(input, seg, env)
assertEquals(result.length, 3, 'Should still return three candidates even for invalid date')
console.log('---------------------------------------')

// Test 5: Non-lunar input handling
console.log('Test 5: Testing non-lunar input handling')
input = 'not_a_lunar_command'
result = lunar.translate(input, seg, env)
assertEquals(result.length, 0, 'Non-lunar commands should return empty array')
console.log('---------------------------------------')

// Test 6: Leap year handling
console.log('Test 6: Testing leap year handling')
input = 'nl20250815' // 2025年闰六月
result = lunar.translate(input, seg, env)
assertEquals(result[0].text, '二〇二五年闰六月廿二', 'Simple format should match for leap month')
assertEquals(result[1].text, '乙巳年闰六月廿二', 'Traditional format should match for leap month')
assertEquals(result[2].text, '乙巳年（蛇）闰六月廿二', 'Full format should match for leap month')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
