;(() => {
  function isPureEnglish(word) {
    return /^[a-z'\- ]+$/.test(word)
  }
  function formatInfo(info) {
    return info.replace(/\\n/g, '\n		')
  }
  var trie
  var En2CnFilter = class {
    constructor(env) {
      console.log('en2cn filter init')
      trie = env.trie || new Trie()
      const txtPath = env.en2cnTextFilePath || `${env.userDataDir}/lua/data/ecdict.txt`
      const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/ecdict.bin`
      let tick = Date.now()
      if (env.fileExists(binPath)) {
        trie.loadBinaryFile(binPath)
        console.log(`en2cn filter: load dict from bin file takes: ${Date.now() - tick}ms`)
      } else {
        trie.loadTextFile(txtPath, 6e4)
        console.log(`en2cn filter: load dict from text file takes: ${Date.now() - tick}ms`)
        trie.saveToBinaryFile(binPath)
        console.log('en2cn filter: saved dict to bin file for future use')
      }
    }
    finalizer() {
      console.log('en2cn filter finit')
    }
    filter(candidates, env) {
      const existingWords = new Map()
      let lastEnglishCandidateIndex = candidates.length === 0 ? 0 : 5
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
      const prefix = env.engine.context.input.toLowerCase()
      if (prefix.length > 2 && isPureEnglish(prefix)) {
        trie.prefixSearch(prefix).forEach((it) => {
          if (existingWords.has(it.text)) return
          const candidate = new Candidate('en', 0, prefix.length, it.text, formatInfo(it.info))
          candidates.splice(lastEnglishCandidateIndex, 0, candidate)
          lastEnglishCandidateIndex++
        })
      }
      return candidates
    }
  }
  globalThis.iife_instance_en2cn_iife_js = new En2CnFilter()
})()
