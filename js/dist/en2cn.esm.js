function isPureEnglish(word) {
  return /^[a-z'\- ]+$/.test(word)
}
function formatInfo(info) {
  return info.replace(/\\n/g, '\n		')
}
var En2CnFilter = class {
  levelDb = null
  constructor(env) {
    console.log('en2cn filter init')
    this.levelDb = env.levelDb || new LevelDb()
    const txtPath = env.en2cnTextFilePath || `${env.userDataDir}/lua/data/ecdict.txt`
    const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/en2cn.ldb`
    let tick = Date.now()
    if (env.fileExists(binPath)) {
      this.levelDb.loadBinaryFile(binPath)
      console.log(`en2cn filter: load dict from bin file takes: ${Date.now() - tick}ms`)
    } else {
      this.levelDb.loadTextFile(txtPath, { lines: 6e4 })
      this.levelDb.saveToBinaryFile(binPath)
      console.log(`en2cn filter: load dict from text to bin takes: ${Date.now() - tick}ms`)
    }
  }
  finalizer() {
    console.log('en2cn filter finit')
    this.levelDb?.close()
  }
  isApplicable(env) {
    return env.engine.context.input.length > 1
  }
  *filter(iter, env) {
    const existingWords = new Map()
    let lastEnglishCandidateIndex = 5
    const processed = []
    for (let idx = 0, candidate; idx < 120 && (candidate = iter.next()); idx++) {
      processed.push(candidate)
      const text = candidate.text.toLowerCase()
      if (!isPureEnglish(text)) {
        continue
      }
      existingWords.set(text, true)
      lastEnglishCandidateIndex = idx
      const info = this.levelDb.find(text)
      if (info) {
        candidate.comment = formatInfo(info)
      }
    }
    const prefix = env.engine.context.input.toLowerCase()
    if (prefix.length > 2 && isPureEnglish(prefix)) {
      this.levelDb.prefixSearch(prefix).forEach((it) => {
        if (existingWords.has(it.text)) return
        const candidate = new Candidate('en', 0, prefix.length, it.text, formatInfo(it.info))
        processed.splice(lastEnglishCandidateIndex, 0, candidate)
        lastEnglishCandidateIndex++
      })
    }
    yield* processed
    return iter
  }
}
export { En2CnFilter }
