// usage: `./qjs ./cn2en_pinyin.test.js`

import * as cn2en_pinyin from '../cn2en_pinyin.js'
import { Trie } from './trie.js'
import { assertEquals } from './testutil.js'

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, start, end, text, comment) {
  this.type = type
  this.start = start
  this.end = end
  this.text = text
  this.comment = comment
}

// Create mock trie with test data
let theTrie = new Trie()
theTrie.loadTextFile = function (path) {
  const content =
    `点点\t[diǎn diǎn]Diandian (Chinese microblogging and social networking website)||[diǎn diǎn]point/speck\n` +
    `中国\t[zhōng guó]China\n` +
    `种过\t[zhòng guò]111\n` +
    `总过\t[zōng guò]xxx\n` +
    `纵谷\t[zòng gǔ]yyy\n` +
    `测试\t[cè shì]test\n` +
    `中\t[zhōng]center\n`

  content
    .split('\n')
    .map(this.parseLine)
    .filter((it) => it)
    .forEach((line) => this.insert(line.text, line.info))
}
theTrie.saveToBinaryFile = function (path) {
  // Do nothing for test
}
theTrie.loadBinaryFile = function (path) {
  // Do nothing for test
}

let committedText = null

// Create mock environment
const env = {
  testing: true,
  trie: theTrie,
  cn2enTextFilePath: './cn2en.text.data',
  en2cnBinaryFilePath: './cn2en.bin.data',
  engine: {
    context: {
      input: '',
      clear: function () {},
    },
    commitText: function (text) {
      committedText = text
    },
  },
  fileExists: (path) => false,
  userDataDir: './test',
}

// Test 1: Test initialization
cn2en_pinyin.init(env)
console.log('Test 1: Init completed')
console.log('---------------------------------------')

// Test 2: Test basic filtering
env.engine.context.input = 'dian'
let candidates = [new Candidate('cn', 0, 4, '点点', '')]
let filtered = cn2en_pinyin.filter(candidates, env)
assertEquals(filtered[0].comment.includes('diǎn diǎn'), true, 'filter: added pinyin annotation')
assertEquals(filtered[0].comment.includes('Diandian'), true, 'filter: added English translation')
assertEquals(filtered[1].comment.includes('diǎn diǎn'), true, 'filter: added pinyin annotation')
assertEquals(filtered[1].comment.includes('point/speck'), true, 'filter: added English translation')
console.log('Test 2: Basic filtering tests passed')
console.log('---------------------------------------')

// Test 3: Test pinyin selection feature
env.engine.context.input = 'dian/p'
filtered = cn2en_pinyin.filter(candidates, env)
assertEquals(filtered[0].comment.startsWith('⇖ʸ'), true, 'filter: added hint code for pinyin selection')
console.log('Test 3: Pinyin selection feature tests passed')
console.log('---------------------------------------')

// Test 4: Test commit pinyin function immediately
env.engine.context.input = 'zhong'
candidates = [new Candidate('py', 0, 4, '中', ''), new Candidate('py', 0, 4, '中国', '')]
filtered = cn2en_pinyin.filter(candidates, env)
env.engine.context.input = 'zhong/p'
filtered = cn2en_pinyin.filter(filtered, env)
env.engine.context.input = 'zhong/py'
filtered = cn2en_pinyin.filter(filtered, env)
assertEquals(committedText, 'zhōng', 'commit correct pinyin immediately')
console.log('Test 4: commit pinyin immediately function tests passed')
console.log('---------------------------------------')

// Test 5: Test English translation feature
env.engine.context.input = 'dian/e'
filtered = cn2en_pinyin.filter(candidates, env)
assertEquals(filtered[0].comment.startsWith('⇖ⁿ'), true, 'filter: added hint code for English translation')
assertEquals(filtered[1].comment.startsWith('⇖ᵃ'), true, 'filter: added hint code for English translation')
console.log('Test 5: English translation feature tests passed')
console.log('---------------------------------------')

// Test 6: Test commit english function immediately
env.engine.context.input = 'zhongguo/e'
candidates = [new Candidate('py', 0, 4, '中国', '')]
filtered = cn2en_pinyin.filter(candidates, env)
env.engine.context.input = 'zhong/en'
filtered = cn2en_pinyin.filter(filtered, env)
assertEquals(committedText, 'China', 'commit correct English immediately')
console.log('Test 6: commit English immediately function tests passed')
console.log('---------------------------------------')

// Disable this test since the sorting is disabled in the plugin
// Test 7: Sort the candidates by unaccented pinyin
// candidates = [
//   new Candidate('cn', 0, 4, '纵谷', ''),
//   new Candidate('cn', 0, 4, '总过', ''),
//   new Candidate('cn', 0, 4, '中国', ''),
//   new Candidate('cn', 0, 4, '种过', ''),
// ]
// env.engine.context.input = 'zhongguo'
// filtered = cn2en_pinyin.filter(candidates, env)
// // Check if the candidates are sorted correctly
// assertEquals(filtered[0].text, '中国', 'filter: sorted by unaccented pinyin')
// assertEquals(filtered[1].text, '种过', 'filter: sorted by unaccented pinyin')
// assertEquals(filtered[2].text, '纵谷', 'filter: sorted by unaccented pinyin')
// assertEquals(filtered[3].text, '总过', 'filter: sorted by unaccented pinyin')
// console.log('Test 7: Sorting by unaccented pinyin tests passed')
// console.log('---------------------------------------')

console.log('All tests passed!')
