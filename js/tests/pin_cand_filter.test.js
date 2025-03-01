// usage: `./qjs ./pin_cand_filter.test.js`

import * as pinCandFilter from '../pin_cand_filter.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.preedit = text // Add preedit field for pin_cand_filter
}

// Create mock environment
const env = {
  engine: {
    schema: {
      config: {
        getList: (key) => ({
          getSize: () => 4,
          getValueAt: (i) => ({
            getString: () => ['le\t了', 'ta\t他 她 它', 'ni hao\t你好', 'zhi chi\t支持'][i],
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

// Test 1: Test initialization
pinCandFilter.init(env)
console.log('---------------------------------------')

// Test 2: Basic filtering with single character
env.engine.context.input = 'le'
let candidates = [new Candidate('abc', 0, 2, '了', '')]
candidates[0].preedit = 'le'
let filtered = pinCandFilter.filter(candidates, env)
assertEquals(filtered[0].text, '了', 'filter: single character pinyin mapping')
console.log('---------------------------------------')

// Test 3: Test multiple candidates ordering
env.engine.context.input = 'ta'
let multiCandidates = [
  new Candidate('abc', 0, 2, '它', ''),
  new Candidate('abc', 0, 2, '塔', ''),
  new Candidate('abc', 0, 2, '她', ''),
  new Candidate('abc', 0, 2, '他', ''),
]
multiCandidates.forEach((cand) => (cand.preedit = 'ta'))
filtered = pinCandFilter.filter(multiCandidates, env)
assertEquals(
  filtered[0].text,
  '他',
  'filter: multiple candidates should be ordered according to configuration',
)
assertEquals(
  filtered[1].text,
  '她',
  'filter: multiple candidates should be ordered according to configuration',
)
assertEquals(
  filtered[2].text,
  '它',
  'filter: multiple candidates should be ordered according to configuration',
)

let equals = filtered[0].text === '他' && filtered[1].text === '她' && filtered[2].text === '它'
assertEquals(equals, true, 'filter: multiple candidates should be ordered according to configuration')
console.log('---------------------------------------')

// Test 4: Test space handling and compound words
env.engine.context.input = 'nihao'
let compoundCandidates = [new Candidate('abc', 0, 5, '你好', '')]
compoundCandidates[0].preedit = 'ni hao'
filtered = pinCandFilter.filter(compoundCandidates, env)
equals = filtered[0].text === '你好'
assertEquals(equals, true, 'filter: compound words with spaces should work')
console.log('---------------------------------------')

// Test 5: Test zh/ch/sh special cases
env.engine.context.input = 'zhichi'
let specialCandidates = [new Candidate('abc', 0, 6, '支持', '')]
specialCandidates[0].preedit = 'zhi chi'
filtered = pinCandFilter.filter(specialCandidates, env)
equals = filtered[0].text === '支持'
assertEquals(equals, true, 'filter: zh/ch/sh special cases should work')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
