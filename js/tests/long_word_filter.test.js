// usage: `./qjs ./long_word_filter.test.js`

import * as longWord from '../long_word_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment, quality) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.quality = quality
}

// Create a dummy env object for init and filter calls
const env = {
  engine: {
    schema: {
      config: {
        getInt: (key) => {
            console.log(`getInt: ${key}`)
          if (key === 'test/count') return 3
          if (key === 'test/idx') return 1
          return null
        }
      }
    }
  },
  namespace: '*test'
}

// Test 1: Init function sets configuration values correctly
longWord.init(env)
console.log('---------------------------------------')

// Test 2: Basic filtering with default settings
let candidates = [
  new Candidate('abc', 0, 1, '你', ''),      // length 1
  new Candidate('abc', 0, 2, '你好', ''),     // length 2
  new Candidate('abc', 0, 3, '你好啊', ''),    // length 3
  new Candidate('abc', 0, 4, '你好世界', ''),   // length 4
  new Candidate('abc', 0, 5, '你好啊世界', ''),  // length 5
]
let filtered = longWord.filter(candidates)
assertEquals(filtered[0].text, '你', 'filter: first candidate should remain unchanged')
assertEquals(filtered[4].text, '你好啊世界', 'filter: longer words should be promoted')
console.log('---------------------------------------')

// Test 3: English/numeric content should not be promoted
candidates = [
  new Candidate('abc', 0, 1, '你', ''),
  new Candidate('abc', 0, 2, 'hello', ''),
  new Candidate('abc', 0, 3, '你好啊', ''),
  new Candidate('abc', 0, 4, '123456', '')
]
filtered = longWord.filter(candidates)
assertEquals(filtered[0].text, '你', 'filter: first candidate should remain unchanged')
assertEquals(filtered[1].text, '你好啊', 'filter: long Chinese words should be promoted')
assertEquals(filtered[2].text, 'hello', 'filter: English words should not be promoted')
assertEquals(filtered[3].text, '123456', 'filter: numeric strings should not be promoted')
console.log('---------------------------------------')

// Test 4: Respect startingIndex setting
candidates = [
  new Candidate('abc', 0, 1, '一', ''),
  new Candidate('abc', 0, 2, '一二', ''),
  new Candidate('abc', 0, 3, '一二三', ''),
  new Candidate('abc', 0, 4, '一二三四', ''),
  new Candidate('abc', 0, 5, '一二三四五', ''),
  new Candidate('abc', 0, 6, '一二三四五六', '')
]
filtered = longWord.filter(candidates)
assertEquals(filtered[4].text, '一二三四五', 'filter: should respect startingIndex for promotion')
console.log('---------------------------------------')

// Test 5: Respect maxPromoteeSize setting
candidates = [
  new Candidate('abc', 0, 1, '甲', ''),
  new Candidate('abc', 0, 2, '甲乙', ''),
  new Candidate('abc', 0, 3, '甲乙丙', ''),
  new Candidate('abc', 0, 4, '甲乙丙丁', ''),
  new Candidate('abc', 0, 5, '甲乙丙丁戊', ''),
  new Candidate('abc', 0, 6, '甲乙丙丁戊己', '')
]
filtered = longWord.filter(candidates)
assertEquals(filtered.length, candidates.length, 'filter: should maintain total number of candidates')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
