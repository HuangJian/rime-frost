// usage: `./qjs ./unicode_translator.test.js`

import { UnicodeTranslator } from '../unicode_translator.js'
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
        getString: (path) => '*U', // Mock the config.getString method
      },
    },
  },
}

// Create a dummy segment object
const segment = {
  start: 0,
  end: 0,
  hasTag: (tag) => tag === 'unicode',
}

// Test 1: Init and finit functions
const instance = new UnicodeTranslator(env)
const keyword = 'U' // Should match the second character of 'xU'
console.log('---------------------------------------')

// Test 2: Basic Unicode conversion
let input = 'U62fc' // Unicode for '拼'
let result = instance.translate(input, segment, env)
let expectedChar = '拼'
let expectedComment = 'U62fc'
assertEquals(result[0].text, expectedChar, 'Basic Unicode conversion should work')
assertEquals(result[0].comment, expectedComment, 'Comment should show Unicode value')
console.log('---------------------------------------')

// Test 3: Maximum value validation
input = 'U110000' // Just above max Unicode value 0x10FFFF
result = instance.translate(input, segment, env)
assertEquals(result[0].text, '数值超限！', 'Should show error for value exceeding 0x10FFFF')
console.log('---------------------------------------')

// Test 4: Additional candidates for values below 0x10000
input = 'U4E00' // Unicode for '一'
result = instance.translate(input, segment, env)
assertEquals(result.length, 17, 'Should generate base character plus 16 additional candidates')
assertEquals(result[0].text, '一', 'First candidate should be the base character')
assertEquals(result[1].text, String.fromCodePoint(0x4e00 * 16 + 0), 'Should generate additional characters')
console.log('---------------------------------------')

// Test 5: Invalid input handling
input = 'U' // Empty code
result = instance.translate(input, segment, env)
assertEquals(result.length, 0, 'Empty code should return no candidates')

input = 'UZZZZ' // Invalid hex
result = instance.translate(input, segment, env)
assertEquals(result.length, 0, 'Invalid hex should return no candidates')
console.log('---------------------------------------')

// Test 6: Tag validation
const invalidSegment = { hasTag: (tag) => false }
result = instance.translate('U4E00', invalidSegment, env)
assertEquals(result.length, 0, 'Non-unicode tag should return no candidates')
console.log('---------------------------------------')

// Test 7: Empty input
result = instance.translate('', segment, env)
assertEquals(result.length, 0, 'Empty input should return no candidates')
console.log('---------------------------------------')

// Test 8: Different prefix from config
const altEnv = {
  engine: {
    schema: {
      config: {
        getString: (path) => 'xV', // Different prefix
      },
    },
  },
}
const other = new UnicodeTranslator(altEnv) // Reinitialize with different config
result = other.translate('V4E00', segment, env) // Using new prefix
assertEquals(result[0].text, '一', 'Should work with different prefix from config')
console.log('---------------------------------------')

// Clean up
instance.finalizer(env)

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
