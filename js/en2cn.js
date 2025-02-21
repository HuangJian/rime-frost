function isPureEnglish(word) {
  return /^[a-z'\- ]+$/.test(word)
}

function formatInfo(info) {
  return info.replace(/\\n/g, '\n\t\t')
}

let trie

export function init(env) {
  console.log('en2cn filter init')

  trie = env.trie || new Trie()

  const txtPath =
    env.en2cnTextFilePath || // for unit test
    `${env.userDataDir}/../lua/data/ecdict.txt`
  const binPath =
    env.en2cnBinaryFilePath || // for unit test
    `${env.userDataDir}/../js/data/ecdict.bin`

  let tick = Date.now()
  if (env.fileExists(binPath)) {
    trie.loadBinaryFile(binPath)
    console.log(`en2cn filter: load dict from bin file takes: ${Date.now() - tick}ms`)
  } else {
    trie.loadTextFile(txtPath, 60000)
    console.log(`en2cn filter: load dict from text file takes: ${Date.now() - tick}ms`)

    trie.saveToBinaryFile(binPath)
    console.log('en2cn filter: saved dict to bin file for future use')
  }
}

export function finit(env) {
  console.log('en2cn filter finit')
}

export function filter(candidates, env) {
  const existingWords = new Map()
  // 从候选项中找到最后一个英文单词的位置，将新查找到的单词插入到该位置之后
  let lastEnglishCandidateIndex =
    candidates.length === 0
      ? 0 // 没有任何候选项就从头插入
      : 5 // 只有中文没有英文候选项，那就插到第五个之后

  // 先为所有英文候选项加上中文释义
  candidates.forEach((it, idx) => {
    const text = it.text.toLowerCase()
    if (!isPureEnglish(text)) return

    existingWords.set(text, true)
    lastEnglishCandidateIndex = idx

    const info = trie.find(text)
    if (info) {
      it.comment = formatInfo(info)
    }
  })

  // 再从英文词典中查找匹配该前缀的单词，添加到候选项中
  const prefix = env.engine.context.input.toLowerCase()
  // 2 个字符以下的前缀不做处理，避免刷屏
  if (prefix.length > 2 && isPureEnglish(prefix)) {
    // 将查找到的单词插入到候选项中
    trie.prefixSearch(prefix).forEach((it) => {
      if (existingWords.has(it.text)) return

      const candidate = new Candidate('en', 0, prefix.length, it.text, formatInfo(it.info))
      candidates.splice(lastEnglishCandidateIndex, 0, candidate)
      lastEnglishCandidateIndex++
    })
  }

  return candidates
}
