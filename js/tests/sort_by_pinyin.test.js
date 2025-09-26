// usage: `./qjs ./sort_by_pinyin.test.js`

import { SortCandidatesByPinyinFilter } from '../sort_by_pinyin.js'
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

// Create a dummy env object for init and filter calls
const env = {
  engine: {
    context: {
      input: 'ni',
    },
  },
}

// Test 1: Initialize the filter
const instance = new SortCandidatesByPinyinFilter(env)
console.log('---------------------------------------')

// Test 2: Test pinyin extraction
let comment1 = '〖nǐ hǎo〗'
let comment2 = '［ni hao］'
let extracted1 = instance.extractPinyin(comment1)
let extracted2 = instance.extractPinyin(comment2)
assertEquals(extracted1, 'ni hao', 'extractPinyin: should extract pinyin from 〖〗 format')
assertEquals(extracted2, 'ni hao', 'extractPinyin: should extract pinyin from ［］ format')
console.log('---------------------------------------')

// Test 3: Test weight calculation
let weight1 = instance.getWeightByPinyin('ni', 'ni', false)
let weight2 = instance.getWeightByPinyin('nihao', 'ni', false)
let weight3 = instance.getWeightByPinyin('mini', 'ni', false)
let weight4 = instance.getWeightByPinyin(undefined, 'ni', true)
assertEquals(weight1, 10002, 'getWeightByPinyin: exact match should have highest weight')
assertEquals(weight2, 5005, 'getWeightByPinyin: prefix match should have medium weight')
assertEquals(weight3, 1004, 'getWeightByPinyin: partial match should have low weight + length')
assertEquals(weight4, 5000, 'getWeightByPinyin: undefined pinyin in user phrase should have highest weight')
console.log('---------------------------------------')

// Test 4: Test candidate sorting with pinyin
let candidates = [
  new Candidate('abc', 0, 1, '你', '〖nǐ〗'),
  new Candidate('abc', 0, 2, '你好', '〖nǐ hǎo〗'),
  new Candidate('abc', 0, 2, '泥巴', '〖ní bā〗'),
  new Candidate('abc', 0, 2, '尼姑', '〖ní gū〗'),
  new Candidate('phrase', 0, 2, '逆行', '〖nì xíng〗'),
]
let generator = instance.filter(makeIterator(candidates), env)
let filtered = getGeneratorYieldValues(generator)
assertEquals(filtered[0].text, '你', 'filter: exact pinyin match should be first')
assertEquals(filtered[1].text, '你好', 'filter: prefix pinyin match should be second')
console.log('---------------------------------------')

// Test 5: Test sorting with mixed candidate types
let mixedCandidates = [
    new Candidate('abc', 0, 2, 'nice', ''), // English word
  new Candidate('cn', 0, 2, '不知道', '〖bù zhī dào〗'),
  new Candidate('abc', 0, 2, '😊', ''), // emoji
  new Candidate('phrase', 0, 2, '逆行', '〖nì xíng〗'),
  new Candidate('cn', 0, 1, '你', '〖nǐ〗'),
]
let mixedGenerator = instance.filter(makeIterator(mixedCandidates), env)
let mixedFiltered = getGeneratorYieldValues(mixedGenerator)
assertEquals(mixedFiltered[0].text, 'nice', 'filter: English word should be kept as is')
assertEquals(mixedFiltered[1].text, '你', 'filter: Chinese character with fully matching pinyin should be first')
assertEquals(mixedFiltered[2].text, '😊', 'filter: Emoji candidate should be kept as is')
assertEquals(mixedFiltered[3].text, '逆行', 'filter: Chinese character with partially matching pinyin should be promoted')
assertEquals(mixedFiltered[4].text, '不知道', 'filter: Chinese character not matching pinyin should be demoted')
console.log('---------------------------------------')

// Print test summary
console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`)
