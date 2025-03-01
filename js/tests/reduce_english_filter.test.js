// usage: `./qjs ./reduce_english_filter.test.js`

import * as reducer from '../reduce_english_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment, quality) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.quality = quality
  this.preedit = text
}

// Create a dummy env object for init and filter calls
const env = {
  engine: {
    schema: {
      config: {
        getInt: (key) => {
          if (key === 'test/idx') return 2
          return null
        },
        getString: (key) => {
          if (key === 'test/mode') return 'custom'
          return null
        },
        getList: (key) => ({
          getSize: () => 2,
          getValueAt: (i) => ({
            getString: () => ['test', 'word'][i],
          }),
        }),
      },
    },
    context: {
      input: '',
    },
  },
  namespace: '*test',
}

// Test 1: Test initialization with custom mode
reducer.init(env)
console.log('---------------------------------------')

// Test 2: Test filtering with non-matching input
env.engine.context.input = 'hello'
let candidates = [
  new Candidate('abc', 0, 5, 'hello', ''),
  new Candidate('abc', 0, 5, 'world', ''),
]
let filtered = reducer.filter(candidates, env)
assertEquals(filtered[0].text, 'hello', 'filter: non-matching input should not change candidates')
assertEquals(filtered[1].text, 'world', 'filter: non-matching input should not change candidates')
console.log('---------------------------------------')

// Test 3: Test filtering with matching input
env.engine.context.input = 'test'
candidates = [
  new Candidate('abc', 0, 4, 'test', ''),
  new Candidate('abc', 0, 4, '测试', ''),
  new Candidate('abc', 0, 4, 'best', ''),
]
filtered = reducer.filter(candidates, env)
assertEquals(filtered[0].text, '测试', 'filter: matching input should lower English words position')
assertEquals(filtered[1].text, 'test', 'filter: matching input should lower English words position')
assertEquals(filtered[2].text, 'best', 'filter: matching input should lower English words position')
console.log('---------------------------------------')

// Test 4: Test filtering with space in preedit
env.engine.context.input = 'test'
candidates = [new Candidate('abc', 0, 4, 'test case', '')]
candidates[0].preedit = 'test case'
filtered = reducer.filter(candidates, env)
assertEquals(filtered[0].text, 'test case', 'filter: words with space should not be lowered')
console.log('---------------------------------------')

// Test 5: Test filtering with non-English text
env.engine.context.input = 'test'
candidates = [new Candidate('abc', 0, 4, '测试', '')]
filtered = reducer.filter(candidates, env)
assertEquals(filtered[0].text, '测试', 'filter: non-English text should not be lowered')
console.log('---------------------------------------')

// Test 6: Test initialization with all mode
env.engine.schema.config.getString = (key) => {
  if (key === 'test/mode') return 'all'
  return null
}
reducer.init(env)
env.engine.context.input = 'aid'
candidates = [
  new Candidate('abc', 0, 3, 'aid', ''),
  new Candidate('abc', 0, 3, '帮助', ''),
]
filtered = reducer.filter(candidates, env)
assertEquals(filtered[0].text, '帮助', 'filter: all mode should include predefined words')
assertEquals(filtered[1].text, 'aid', 'filter: all mode should include predefined words')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
