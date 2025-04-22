var accents =
  '\u0101\xE1\u01CE\xE0\u0113\xE9\u011B\xE8\u012B\xED\u01D0\xEC\u014D\xF3\u01D2\xF2\u016B\xFA\u01D4\xF9\u01D6\u01D8\u01DA\u01DC\xFC'
var without = 'aaaaeeeeiiiioooouuuuvvvvv'
var dict = {}
accents.split('').forEach((char, idx) => (dict[char] = without[idx]))
function isChineseWord(word) {
  return /[\u4e00-\u9fff]/.test(word)
}
var sizeToLookupEnglish = 200
var enHintCodes =
  '\u207F\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u2071\u02B2\u1D4F\u02E1\u1D50\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u02B8\u1DBB'
var enHintKeys = 'nabcdefghijklmoprstuvwxyz'
var pyHintCodes =
  '\u02B8\u1D43\u1D47\u1D9C\u1D48\u1D49\u1DA0\u1D4D\u02B0\u2071\u02B2\u1D4F\u02E1\u1D50\u207F\u1D52\u1D56\u02B3\u02E2\u1D57\u1D58\u1D5B\u02B7\u02E3\u1DBB'
var pyHintKeys = 'yabcdefghijklmnoprstuvwxz'
var trie
var Cn2EnFilter = class {
  constructor(env) {
    console.log('cn2en_pinyin filter init')
    trie = env.trie || new Trie()
    const txtPath = env.cn2enTextFilePath || `${env.userDataDir}/js/data/cedict_fixed.u8`
    const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/cedict.bin`
    let tick = Date.now()
    if (env.fileExists(binPath)) {
      trie.loadBinaryFile(binPath)
      console.log(`cn2en_pinyin filter: load dict from binary file takes: ${Date.now() - tick}ms`)
    } else {
      trie.loadTextFile(txtPath, 119e3)
      console.log(`cn2en_pinyin filter: load dict from text file takes: ${Date.now() - tick}ms`)
      trie.saveToBinaryFile(binPath)
      console.log('cn2en_pinyin filter: saved dict to a binary file for future use')
    }
  }
  finalizer() {
    console.log('cn2en_pinyin filter finit')
  }
  isApplicable(env) {
    return env.engine.context.input.length > 1
  }
  filter(candidates, env) {
    const input = env.engine.context.input
    const ret = []
    candidates.forEach((candidate, idx) => {
      if (
        idx >= sizeToLookupEnglish ||
        candidate.text.length > 10 ||
        !isChineseWord(candidate.text) ||
        candidate.comment.includes('\u3016') ||
        false
      ) {
        ret.push(candidate)
        return
      }
      const info = trie.find(candidate.text)
      if (!info) {
        ret.push(candidate)
        return
      }
      const candidatesHavingTheSameText = extractCandidatesByInfo(candidate, info, input)
      ret.push(...candidatesHavingTheSameText)
    })
    hintToPickEnglish(ret, input)
    tryPrependOrCommitEnglish(ret, input, env.engine)
    hintToPickPinyin(ret, input)
    tryPrependOrCommitPinyin(ret, input, env.engine)
    return ret
  }
}
function extractCandidatesByInfo(candidate, info, inputCode) {
  const prevComment = candidate.comment?.replace(/(［.+)］/g, '')
  const ret = info
    .split('||')
    .map((item, idx) => {
      const [_, pinyin, en] = /^\[(.*?)\](.*)$/.exec(item) || []
      if (!pinyin) return null
      const comment = prevComment + '\u3016' + pinyin + '\u3017' + en
      let theCandidate = candidate
      if (idx > 0) {
        theCandidate = new Candidate('cn', 0, inputCode.length, candidate.text, comment)
      } else {
        theCandidate.comment = comment
      }
      theCandidate.pinyin = pinyin
      theCandidate.en = en
      return theCandidate
    })
    .filter((it) => it)
  return ret.length > 0 ? ret : [candidate]
}
function hintToPickEnglish(candidates, input) {
  if (input.length < 3 || !/\/e.?$/.test(input)) return
  let idxHint = 0
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    if (item.en && idxHint < enHintKeys.length) {
      item.comment = '\u21D6' + enHintCodes[idxHint] + item.comment
      if (idxHint++ >= enHintKeys.length) break
    }
  }
}
function tryPrependOrCommitEnglish(candidates, input, engine) {
  const inputSize = input.length
  if (input.substring(inputSize - 3, inputSize - 1) !== '/e') return
  const lastChar = input.substring(inputSize - 1, inputSize)
  const idx = enHintKeys.indexOf(lastChar)
  if (idx < 0) return
  const hintCode = '\u21D6' + enHintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return
  const rightBracketPos = pickingItem.comment.indexOf('\u3017')
  const arr = pickingItem.comment
    .substring(rightBracketPos + 1)
    .split('/')
    .filter((it) => !it.includes('CL'))
  if (arr.length === 1) {
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    candidates.unshift(pickingItem)
    const text = pickingItem.text
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('en', 0, inputSize + 2, it, '\u7FFB\u8BD1\u81EA\uFF1A' + text))
    })
  }
}
function hintToPickPinyin(candidates, input) {
  if (input.length < 3 || !/\/p.?$/.test(input)) return
  let idxHint = 0
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    if (item.pinyin && idxHint < pyHintKeys.length) {
      item.comment = '\u21D6' + pyHintCodes[idxHint] + item.comment
      if (idxHint++ >= pyHintKeys.length) break
    }
  }
}
function tryPrependOrCommitPinyin(candidates, input, engine) {
  const inputSize = input.length
  if (input.substring(inputSize - 3, inputSize - 1) !== '/p') return
  const lastChar = input.substring(inputSize - 1, inputSize)
  const idx = pyHintKeys.indexOf(lastChar)
  if (idx < 0) return
  const hintCode = '\u21D6' + pyHintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return
  const arr = pickingItem.pinyin.split(' ')
  if (arr.length === 1) {
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    candidates.unshift(pickingItem)
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('py', 0, inputSize + 2, it, '\u62FC\u97F3\uFF1A' + pickingItem.text))
    })
    candidates.unshift(
      new Candidate('py', 0, inputSize + 2, pickingItem.pinyin, '\u62FC\u97F3\uFF1A' + pickingItem.text),
    )
  }
}
export { Cn2EnFilter }
