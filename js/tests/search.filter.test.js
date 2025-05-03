// usage: `./qjs ./tests/search.filter.test.js`

// @ts-nocheck

import { SearchFilter } from '../search.filter.js'
import { assert, assertEquals, totalTests, passedTests } from './testutil.js'
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
    const content = '# Comment line\n' +
      "𬭸\tjin'mi'xi'kuang'shu\n" +
      '中\tzhong\n' +
      '国\tguo\n' +
      '测\tce\n' +
      '试\tshi\n'

    content
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .forEach(line => {
        const [value, key] = line.split('\t')
        if (key && value) {
          const cleanKey = key.replace(/'/g, '')
          this.store.set(cleanKey, value)
        }
      })
  }

  saveToBinaryFile(path) {
    // Do nothing for testing
  }

  loadBinaryFile(path) {
    // Do nothing for testing
  }

  prefixSearch(prefix) {
    const results = []
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(prefix)) {
        results.push({ info: value })
      }
    }
    return results
  }

  close() {
    this.store.clear()
  }
}

// Create mock environment
const env = {
  id: 'session1',
  testing: true,
  levelDb: new LevelDb(),
  userDataDir: './test',
  fileExists: (path) => false,
  engine: {
    context: {
      input: '',
      clear: function () {},
      commit: function () {
        ++commitTimes
      },
      selectNotifier: {
        connect: function (callback) {
          selectCallback = callback
          return {
            get isConnected() {
              return isEnv1NotifierConnected
            },
            disconnect: function () {
              isEnv1DisconnectedCalled = true
            },
          }
        },
      },
      preedit: { text: '' },
    },
  },
}

let commitTimes = 0
let selectCallback = null
let isEnv1NotifierConnected = true
let isEnv1DisconnectedCalled = false

// Test 1: Test initialization and dictionary loading
const instance = new SearchFilter(env)
console.log('Test 1: Init completed')
console.log('---------------------------------------')

// Test 2: Test basic filtering without conductor
env.engine.context.input = 'zhong'
let candidates = [new Candidate('py', 0, 4, '测', ''), new Candidate('py', 0, 4, '中', '')]
let generator = instance.filter(makeIterator(candidates), env)
let filtered = getGeneratorYieldValues(generator)
assertEquals(filtered, candidates, 'filter: should return original candidates when no conductor')
console.log('Test 2: Basic filtering without conductor tests passed')
console.log('---------------------------------------')

// Test 3: Test filtering with conductor and matching code
env.engine.context.input = 'z`zhong'
candidates = [new Candidate('py', 0, 4, '测', ''), new Candidate('py', 0, 4, '中', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)
assertEquals(filtered[0].text, '中', 'filter: should prioritize matched character')
console.log('Test 3: Filtering with conductor tests passed')
console.log('---------------------------------------')

// Test 4: Test filtering with conductor and non-matching code
env.engine.context.input = 'z`ce'
candidates = [new Candidate('py', 0, 4, '测', ''), new Candidate('py', 0, 4, '中', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)
assertEquals(filtered[0].text, '测', 'filter: should prioritize matched character')
console.log('Test 4: Filtering with non-matching code tests passed')
console.log('---------------------------------------')

// Test 5: Test filtering with conductor at start
env.engine.context.input = '`zhong'
candidates = [new Candidate('py', 0, 4, '测', ''), new Candidate('py', 0, 4, '中', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)
assertEquals(filtered, candidates, 'filter: should return original candidates when conductor at start')
console.log('Test 5: Filtering with conductor at start tests passed')
console.log('---------------------------------------')

// Test 6: Test listener connection
env.engine.context.input = 'test`jin'
candidates = [new Candidate('py', 0, 4, '𬭸', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)
assertEquals(filtered[0].text, '𬭸', 'filter: should connect listener and handle selection')
console.log('Test 6: Listener connection tests passed')
console.log('---------------------------------------')

// Test 7: Test prefix search with multiple matches
env.engine.context.input = 'test`sh'
candidates = [new Candidate('py', 0, 4, '试', ''), new Candidate('py', 0, 4, '中', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)
assertEquals(filtered[0].text, '试', 'filter: should match prefix search correctly')
console.log('Test 7: Prefix search tests passed')
console.log('---------------------------------------')

// Test 8: Test selection callback with phrase
env.engine.context.input = 'jiazheshenxi`jin'
env.engine.context.preedit.text = '镓zheshenxi`jin'
selectCallback(env.engine.context)
assertEquals(env.engine.context.input, 'jiazheshenxi`', 'filter: should retain conductor for phrases')
assertEquals(commitTimes, 0, 'filter: should not commit with remaining characters')
console.log('Test 8: Selection callback with phrase tests passed')
console.log('---------------------------------------')

// Test 9: Test selection callback with single character
env.engine.context.input = 'test`jin'
env.engine.context.preedit.text = '测`jin'
selectCallback(env.engine.context)
assertEquals(env.engine.context.input, 'test', 'filter: should remove conductor for single character')
assertEquals(commitTimes, 1, 'filter: should commit after selecting the last character')
console.log('Test 9: Selection callback with single character tests passed')
console.log('---------------------------------------')

// Test 10: Test notifier connection management with multiple environments
let env2 = JSON.parse(JSON.stringify(env)) // Deep clone the env object
env2.id = 'session2' // Add a different environment ID

// Create a proper mock selectNotifier for env2
let env2Connected = false
let env2Callback = null
env2.engine.context.selectNotifier = {
  connect: function (callback) {
    env2Connected = true
    env2Callback = callback
    return {
      connected: true,
      disconnect: function () {
        env2Connected = false
        env2Callback = null
      },
    }
  },
}

// First session filter operation
env.engine.context.input = 'test`jin'
candidates = [new Candidate('py', 0, 4, '𬭸', '')]
generator = instance.filter(makeIterator(candidates), env)
filtered = getGeneratorYieldValues(generator)

// Second session filter operation
env2.engine.context.input = 'other`jin'
candidates = [new Candidate('py', 0, 4, '𬭸', '')]
generator = instance.filter(makeIterator(candidates), env2)
filtered = getGeneratorYieldValues(generator)

// Verify env2 connection is established
assert(env2Connected && env2Callback, 'filter: env2 notifier should be properly connected')

// Simulate session1 disconnection
isEnv1NotifierConnected = false

// Third session filter operation should maintain env2 connection
env2.engine.context.input = 'final`jin'
candidates = [new Candidate('py', 0, 4, '𬭸', '')]
generator = instance.filter(makeIterator(candidates), env2)
filtered = getGeneratorYieldValues(generator)

// Verify env2 connection is still active
assert(env2Connected && env2Callback, 'filter: env2 notifier should remain connected after env1 disconnect')

// Verify env1 disconnection callback is called
assert(isEnv1DisconnectedCalled, 'filter: env1 notifier disconnect callback should be called')

console.log('Test 10: Notifier connection management tests passed')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
