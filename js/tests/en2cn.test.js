// usage: `./qjs ./en2cn.test.js`

import { En2CnFilter } from '../en2cn.js'
import { assertEquals, totalTests, passedTests } from './testutil.js'
import { makeIterator, getGeneratorYieldValues } from './generator.helper.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment, quality) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
  this.quality = quality || 1
}

// Mock LevelDb implementation for testing
class LevelDb {
  constructor() {
    this.store = new Map()
  }

  loadTextFile(path, options = {}) {
    const content = 'testword\tinfo for testword\napplepie\tinfo for applepie\naaa\tinfo for aaa\naaab\tinfo for aaab\n'

    content
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .forEach(line => {
        const [text, info] = line.split('\t')
        if (text && info) {
          this.store.set(text.toLowerCase(), info)
        }
      })
  }

  saveToBinaryFile(path) {
    // Do nothing for testing
  }

  loadBinaryFile(path) {
    // Do nothing for testing
  }

  find(text) {
    return this.store.get(text.toLowerCase())
  }

  prefixSearch(prefix) {
    const results = []
    for (const [text, info] of this.store.entries()) {
      if (text.startsWith(prefix.toLowerCase())) {
        results.push({ text, info })
      }
    }
    return results
  }

  close() {
    this.store.clear()
  }
}

// Create a dummy env object for init and filter calls.
const env = {
  testing: true,
  levelDb: new LevelDb(),
  en2cnTextFilePath: './en2cn.text.data',
  en2cnBinaryFilePath: './en2cn.bin.data',
  engine: {
    context: {
      input: '',
    },
  },
  fileExists: (path) => false,
}

// Test 1: Init builds the dictionary and shows correct candidates via filter.
// Call init to load the sample dictionary.
const en2cn = new En2CnFilter(env)
console.log('---------------------------------------')

// Test 2: Filter with empty candidate list, input "test" should add candidate for "testword".
// Explanation: "test" length(4) > firstLevelKeySize(3), so searchByPrefix will use the second-level search.
env.engine.context.input = 'test'
let candidates = []
let generator = en2cn.filter(makeIterator(candidates), env)
let result = getGeneratorYieldValues(generator)
// We expect one candidate inserted for "testword" (the candidate has text "testword" and comment "info for testword")
let foundTestword = result.find((c) => c.text === 'testword')
assertEquals(foundTestword?.comment, 'info for testword', "filter: added candidate for 'testword'")
console.log('---------------------------------------')

// Test 3: Filter with a candidate that is pure Chinese should not trigger dictionary lookup.
// Prepare a candidate with non-English text.
env.engine.context.input = 'appl' // even though prefix is english, candidate is non-English so should not add duplicate english candidate.
candidates = [{ text: '苹果', comment: '' }]
generator = en2cn.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
let appleCandidate = result.find((c) => c.text === 'applepie')
assertEquals(
  appleCandidate?.comment,
  'info for applepie',
  "filter: inserted candidate for 'applepie' alongside non-English candidate",
)
console.log('---------------------------------------')

// Test 4: Filter when a candidate already exists. Pre-insert a candidate with text "testword".
// It should not be duplicated.
env.engine.context.input = 'test'
candidates = [new Candidate('en', 0, 4, 'testword', 'old comment')]
generator = en2cn.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
// Expect only one candidate, and its comment should be updated by filter.
assertEquals(result.length, 1, "filter: not duplicating existing candidate for 'testword'")
assertEquals(
  result[0].comment,
  'info for testword',
  "filter: updated comment for existing 'testword' candidate",
)
console.log('---------------------------------------')

// Test 5: Filter with a short prefix should not trigger dictionary lookup.
// Explanation: Prefix length is less than 3, so no dictionary lookup should be done.
env.engine.context.input = 'aa'
candidates = []
generator = en2cn.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
// Expect no candidates added for short prefix.
assertEquals(result.length, 0, 'filter: no candidates added for short prefix')
console.log('---------------------------------------')

// Test 6: Filter with a 3-char prefix should trigger dictionary lookup.
// Explanation: Prefix length is 3, so dictionary lookup should be done.
env.engine.context.input = 'aaa'
candidates = []
generator = en2cn.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
let matches = result.filter((c) => c.text === 'aaa')
// Expect one candidate added for "aaa" (the candidate has text "aaa" and comment "info for aaa")
assertEquals(matches.length, 1, "filter: added candidate for 'aaa'")
assertEquals(matches[0].comment, 'info for aaa', "filter: added comment for 'aaa'")
console.log('---------------------------------------')

// Test 7: Filter with a 4-char prefix should trigger dictionary lookup.
// Explanation: Prefix length is 4, so dictionary lookup should be done.
env.engine.context.input = 'aaab'
candidates = []
generator = en2cn.filter(makeIterator(candidates), env)
result = getGeneratorYieldValues(generator)
matches = result.filter((c) => c.text === 'aaab')
// Expect one candidate added for "aaab" (the candidate has text "aaab" and comment "info for aaab")
assertEquals(matches.length, 1, "filter: added candidate for 'aaab'")
assertEquals(matches[0].comment, 'info for aaab', "filter: added comment for 'aaab'")
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
