//  Usage:
//    - grep -vE "node:fs" ./en2cn.benchmark.js > ./qjs.tmp.js && ../qjs --std ./qjs.tmp.js
//    - node ./en2cn.benchmark.js
//    - bun ./en2cn.benchmark.js
//    - deno ./en2cn.benchmark.js

// ========== Performace benchmark ==========
// lua      ~150ms:  line:match("^(.-)%s+(.+)%s*$")
// ------------------------------
// quickjs  ~770ms:  indexOf('\t')
// quickjs ~1660ms:  line.match(/^(.*?)\s+(.+)\s*$/)
// ------------------------------
// nodejs   ~114ms:  indexOf('\t')
// nodejs   ~110ms:  line.match(/^(.*?)\s+(.+)\s*$/)
// ------------------------------
// bun       ~70ms:  indexOf('\t')
// bun       ~80ms:  line.match(/^(.*?)\s+(.+)\s*$/)
// ------------------------------
// deno      ~105ms:  indexOf('\t')
// deno      ~118ms:  line.match(/^(.*?)\s+(.+)\s*$/)
// ------------------------------
// cpp      ~120ms:  getline(dict_file, line) + line.find('\t')
// cpp       ~10ms:  mmap + Trie&vector deserialization

import * as en2cn from '../../en2cn.js'
import { Trie } from '../trie.js'
import { assertEquals, getDetailedRuntimeInfo } from '../testutil.js'
import * as fs from 'node:fs'

const rt = getDetailedRuntimeInfo()

// Define a dummy Candidate constructor for testing
globalThis.Candidate = function (type, score, prefixSize, text, comment) {
  this.type = type
  this.score = score
  this.prefixSize = prefixSize
  this.text = text
  this.comment = comment
}

const env = {
  testing: true,
  trie: null,
  en2cnTextFilePath: '../../../lua/data/ecdict.txt',
  en2cnBinaryFilePath: './en2cn.bin.data',
  engine: {
    context: {
      input: '',
    },
  },
  fileExists: () => false,
}

if (rt.runtime.toLowerCase().includes('quickjs')) {
  console.log('Skip warming up the runtime for QuickJS')
} else {
  console.log('warming up the runtime...')
  env.trie = makeTrie()
  en2cn.init(env)
  env.trie = makeTrie(false)
  en2cn.init(env)
}

console.log('\n########## Performance benchmark ##########')

console.log(`===== ${rt.runtime} v${rt.version}: parse file with \`indexOf("\\t")\` =====`)
env.trie = makeTrie(false)
en2cn.init(env)
checkTrieData()

console.log(`===== ${rt.runtime} v${rt.version}: parse file with \`line.match(/^(.*?)\\s+(.+)\\s*$/)\` =====`)
env.trie = makeTrie(true)
en2cn.init(env)
checkTrieData()

function checkTrieData() {
  const result1 = env.trie.find('accord')
  assertEquals(result1, "[ә'kɒ:d]; n. 一致, 调和, 协定\\n vt. 给与, 使一致\\n vi. 相符合")
  const result2 = env.trie.find('accordion')
  assertEquals(result2, "[ә'kɒ:djәn]; n. 手风琴\\n a. 可折叠的")
  const result3 = env.trie.find('nonexistent-word')
  assertEquals(result3, null)
  const prefix_results = env.trie.prefixSearch('accord')
  assertEquals(prefix_results.length, 6)
}

function makeTrie(useRegex) {
  const trie = new Trie()
  trie.loadTextFile = function (path) {
    const func = useRegex ? trie.parseLineRegex : trie.parseLine
    readFileSync(path, 'utf8')
      .split('\n')
      .map(func)
      .filter((it) => it)
      .forEach((line) => trie.insert(line.text, line.info))
  }
  trie.saveToBinaryFile = () => {}
  trie.loadBinaryFile = () => {}
  return trie
}

function readFileSync(path) {
  if (rt.runtime === 'Node.js') {
    return fs.readFileSync(path, 'utf8')
  } else if (rt.runtime === 'Bun') {
    return fs.readFileSync(path, 'utf8')
  } else if (rt.runtime.toLowerCase().includes('quickjs')) {
    return std.loadFile(path)
  } else if (rt.runtime === 'Deno') {
    return fs.readFileSync(path, 'utf8')
  }
  throw 'Unsupported runtime'
}
