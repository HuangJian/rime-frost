let trie

export function init(env) {
  console.log('cn2en_pinyin filter init')

  trie = env.trie || new Trie()

  const txtPath =
    env.cn2enTextFilePath || // for unit test
    `${env.userDataDir}/../lua/data/cedict_fixed.u8`
  const binPath =
    env.en2cnBinaryFilePath || // for unit test
    `${env.userDataDir}/../js/data/cedict.bin`

  let tick = Date.now()
  if (env.fileExists(binPath)) {
    trie.loadBinaryFile(binPath)
    console.log(`cn2en_pinyin filter: load dict from binary file takes: ${Date.now() - tick}ms`)
  } else {
    trie.loadTextFile(txtPath, 119000)
    console.log(`cn2en_pinyin filter: load dict from text file takes: ${Date.now() - tick}ms`)

    trie.saveToBinaryFile(binPath)
    console.log('cn2en_pinyin filter: saved dict to a binary file for future use')
  }
}

export function finit(env) {
  console.log('cn2en_pinyin filter finit')
}

export function filter(candidates, env) {
  // const start = Date.now()
  const code = env.engine.context.input
  // Remove everything after a slash (e.g. "zhangk/e" becomes "zhangk")
  const prefix = code.replace(/\/.*/, '')

  const size = candidates.length
  const ret = []
  candidates.forEach((candidate, idx) => {
    if (candidate.type === 'sentence') {
      // 长句子优先级最高
      candidate.weight = 9999999
      ret.push(candidate)
      return
    }

    candidate.weight = size - idx
    if (candidate.type === 'user_phrase') {
      // 用户词典，先设置基础权重。后面若拼音匹配还会继续提升权重。
      candidate.weight += 10000
    }

    if (
      idx > 512 || // 只查找前面512个候选词，避免性能问题
      candidate.text.length > 10 || // 超过10个字的词不查找
      !isChineseWord(candidate.text) || // not a Chinese word
      candidate.comment.includes('〖') || // 已经有英文了，跳过
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

    const candidatesWithTheSameText = extractCandidatesByInfo(candidate, info, prefix, size - idx)
    ret.push(...candidatesWithTheSameText)
  })

  ret.sort((a, b) => b.weight - a.weight)

  tryTranslateToEnglish(code, env.engine, ret)
  tryTranslateToPinyin(code, env.engine, ret)

  // 3738 candidates filtered in 14ms
  // 580 candidates filtered in 6ms
  // console.log(`cn2en_pinyin filter: ${ret.length} candidates filtered in ${Date.now() - start}ms`)
  return ret
}

// 如果候选项只有一个拼音，直接更新其注解为：`[拼音] 英文`
// 如果候选项有多个拼音，更新其注解为：`[拼音1] 英文1`，然后插入新的候选项，其注解为：`[拼音2] 英文2`，以此类推
function extractCandidatesByInfo(candidate, info, prefix, defaultWeight) {
  // [diǎn diǎn]Diandian (Chinese microblogging and social networking website)||[diǎn diǎn]point/speck
  const ret = info
    .split('||')
    .map((item, idx) => {
      const [_, pinyin, en] = item.match(/^\[(.*?)\](.*)$/) || []
      if (!pinyin) return null

      const comment = '〖' + pinyin + '〗' + en
      const unaccentedPinyin = unaccent(pinyin.replaceAll(' ', ''))
      // 设置候选项权重以重新排序
      // 主要目的是避免启用模糊音后，拼音完全匹配的候选项被推到了后面
      let weight =
        unaccentedPinyin === prefix
          ? 59999 - idx + defaultWeight // 完全匹配的拼音权重最高
          : unaccentedPinyin.startsWith(prefix)
          ? 999 - idx + defaultWeight // 前序匹配的拼音权重次之
          : defaultWeight // 其它候选项保持原来权重

      if (candidate.type === 'user_phrase' && unaccentedPinyin !== prefix) {
        // 用户词典，保持权重
        weight = candidate.weight
      }

      const theCandidate =
        idx === 0 ? candidate : new Candidate('cn', 0, prefix.length, candidate.text, comment)
      theCandidate.comment = comment
      theCandidate.pinyin = pinyin
      theCandidate.en = en
      theCandidate.weight = weight

      return theCandidate
    })
    .filter((it) => it)
  return ret.length > 0 ? ret : [candidate]
}

const accents = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'
const without = 'aaaaeeeeiiiioooouuuuvvvvv'
const dict = {}
accents.split('').forEach((char, idx) => (dict[char] = without[idx]))

function unaccent(str) {
  return str
    .split('')
    .map((char, i) => {
      return dict[char] || char
    })
    .join('')
}

function isChineseWord(word) {
  // Check for at least one Chinese character (range U+4E00 to U+9FFF)
  return /[\u4e00-\u9fff]/.test(word)
}

function tryTranslateToEnglish(code, engine, candidates) {
  const codeSize = code.length
  if (codeSize < 3) return

  const hintCodes = 'ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'
  const hintKeys = 'nabcdefghijklmoprstuvwxyz'
  if (/\/e.?$/.test(code)) {
    // '/e' 启用汉译英上屏，注释上提示汉译英候选项的辅助码 => '/en', '/ea', '/eb', ...
    let idxHint = 0
    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i]
      if (item.en && idxHint < hintKeys.length) {
        item.comment = '⇖' + hintCodes[idxHint] + item.comment
        if (idxHint++ >= hintKeys.length) break
      }
    }
  }

  if (code.substring(codeSize - 3, codeSize - 1) !== '/e') return

  const lastChar = code.substring(codeSize - 1, codeSize)
  const idx = hintKeys.indexOf(lastChar) // '/en' => 1st, '/ea' => 2nd, '/eb' => 3rd, ...
  if (idx < 0) return

  const hintCode = '⇖' + hintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return

  const rightBracketPos = pickingItem.comment.indexOf('〗')
  const arr = pickingItem.comment
    .substring(rightBracketPos + 1)
    .split('/')
    .filter((it) => !it.includes('CL')) // CL 表示量词，不候选

  if (arr.length === 1) {
    // 唯一翻译，直接上屏
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    // 多种翻译，插入候选
    candidates.unshift(pickingItem) // 把对应的汉语候选项移到最上面
    const text = pickingItem.text
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('en', 0, codeSize + 2, it, '翻译自：' + text))
    })
  }
}

function tryTranslateToPinyin(code, engine, candidates) {
  const codeSize = code.length
  if (codeSize < 3) return

  const hintCodes = 'ʸᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣᶻ'
  const hintKeys = 'yabcdefghijklmnoprstuvwxz'
  if (/\/p.?$/.test(code)) {
    // '/p' enables pinyin selection with hint codes => '/py', '/pa', '/pb', ...
    let idxHint = 0
    for (let i = 0; i < candidates.length; i++) {
      const item = candidates[i]
      if (item.pinyin && idxHint < hintKeys.length) {
        item.comment = '⇖' + hintCodes[idxHint] + item.comment
        if (idxHint++ >= hintKeys.length) break
      }
    }
  }

  if (code.substring(codeSize - 3, codeSize - 1) !== '/p') return

  const lastChar = code.substring(codeSize - 1, codeSize)
  const idx = hintKeys.indexOf(lastChar) // '/py' => 1st, '/pa' => 2nd, '/pb' => 3rd, ...
  if (idx < 0) return

  // const pickingItem = candidates[idx]
  const hintCode = '⇖' + hintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return

  const arr = pickingItem.pinyin.split(' ')
  if (arr.length === 1) {
    // Single pinyin, commit directly
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    // Multiple pinyin syllables, insert as candidates
    candidates.unshift(pickingItem) // Move the corresponding Chinese candidate to the top
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('py', 0, codeSize + 2, it, '拼音：' + pickingItem.text))
    })
    candidates.unshift(new Candidate('py', 0, codeSize + 2, pickingItem.pinyin, '拼音：' + pickingItem.text))
  }
}
