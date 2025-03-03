// usage: `./qjs ./date_translator.test.js`

import * as dateTranslator from '../date_translator.js'
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
        getString: function (key) {
          const customKeys = {
            'date_translator/date': 'custom_rq',
            'date_translator/time': 'custom_sj',
            'date_translator/week': 'custom_xq',
            'date_translator/datetime': 'custom_dt',
            'date_translator/timestamp': 'custom_ts',
          }
          return customKeys[key]
        },
      },
    },
  },
  namespace: 'date_translator',
}

const seg = { start: 0, end: 0 }

// Test 1: Initialization
dateTranslator.init(env)
console.log('Test 1: Initialization - Passed')
console.log('---------------------------------------')

// Test 2: Date formatting
let input = 'custom_rq'
let result = dateTranslator.translate(input, seg, env)
const dateRegex = /^\d{4}[-\/.]\d{2}[-\/.]\d{2}$/
const chineseDateRegex = /^\d{4}年\d{1,2}月\d{1,2}日$/

assertEquals(result.length, 5, 'Should return 5 date format variations')
assertEquals(dateRegex.test(result[0].text), true, 'Should match YYYY-MM-DD format')
assertEquals(dateRegex.test(result[1].text), true, 'Should match YYYY/MM/DD format')
assertEquals(dateRegex.test(result[2].text), true, 'Should match YYYY.MM.DD format')
assertEquals(/^\d{8}$/.test(result[3].text), true, 'Should match YYYYMMDD format')
assertEquals(chineseDateRegex.test(result[4].text), true, 'Should match Chinese date format')
console.log('Test 2: Date formatting - Passed')
console.log('---------------------------------------')

// Test 3: Time formatting
input = 'custom_sj'
result = dateTranslator.translate(input, seg, env)
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/

assertEquals(result.length, 3, 'Should return 3 time format variations')
assertEquals(timeRegex.test(result[0].text), true, 'Should match HH:MM format')
assertEquals(timeRegex.test(result[1].text), true, 'Should match HH:MM:SS format')
assertEquals(/^\d{6}$/.test(result[2].text), true, 'Should match HHMMSS format')
console.log('Test 3: Time formatting - Passed')
console.log('---------------------------------------')

// Test 4: Week formatting
input = 'custom_xq'
result = dateTranslator.translate(input, seg, env)
const weekday = ['日', '一', '二', '三', '四', '五', '六'][new Date().getDay()]

assertEquals(result.length, 3, 'Should return 3 week format variations')
assertEquals(result[0].text, '星期' + weekday, 'Should match 星期X format')
assertEquals(result[1].text, '礼拜' + weekday, 'Should match 礼拜X format')
assertEquals(result[2].text, '周' + weekday, 'Should match 周X format')
console.log('Test 4: Week formatting - Passed')
console.log('---------------------------------------')

// Test 5: DateTime ISO format
input = 'custom_dt'
result = dateTranslator.translate(input, seg, env)
const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/
const standardDateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

assertEquals(result.length, 3, 'Should return 3 datetime format variations')
assertEquals(isoRegex.test(result[0].text), true, 'Should match ISO format with timezone')
assertEquals(standardDateTimeRegex.test(result[1].text), true, 'Should match standard datetime format')
assertEquals(/^\d{14}$/.test(result[2].text), true, 'Should match compact datetime format')
console.log('Test 5: DateTime formatting - Passed')
console.log('---------------------------------------')

// Test 6: Timestamp
input = 'custom_ts'
result = dateTranslator.translate(input, seg, env)

assertEquals(result.length, 1, 'Should return 1 timestamp format')
assertEquals(/^\d{10}$/.test(result[0].text), true, 'Should be a 10-digit timestamp')
const timestamp = parseInt(result[0].text)
const now = Math.floor(Date.now() / 1000)
assertEquals(Math.abs(timestamp - now) < 2, true, 'Timestamp should be within 2 seconds of current time')
console.log('Test 6: Timestamp - Passed')
console.log('---------------------------------------')

// Test 7: Invalid input
input = 'invalid_key'
result = dateTranslator.translate(input, seg, env)
assertEquals(result.length, 0, 'Should return empty array for invalid input')
console.log('Test 7: Invalid input - Passed')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
