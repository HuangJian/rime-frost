;(() => {
  var SearchFilter = class {
    dict = null
    selectListeners = []
    constructor(env) {
      console.log('search.filter.js init')
      this.dict = env.trie || new Trie()
      const txtPath = env.en2cnTextFilePath || `${env.userDataDir}/radical_pinyin.dict.yaml`
      const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/radical.trie`
      let tick = Date.now()
      if (env.fileExists(binPath)) {
        this.dict.loadBinaryFile(binPath)
        console.log(`search filter: load radical dict from bin file takes: ${Date.now() - tick}ms`)
      } else {
        const isReversed = true
        const charsToRemove = "'"
        this.dict.loadTextFile(txtPath, 40300, isReversed, charsToRemove)
        console.log(`search filter: load radical dict from text file takes: ${Date.now() - tick}ms`)
        this.dict.saveToBinaryFile(binPath)
        console.log('search filter: saved radical dict to bin file for future use')
      }
    }
    finalizer() {
      console.log('search.filter.js finit')
      this.selectListeners.forEach((it) => it.connection.disconnect())
      this.selectListeners = []
    }
    isApplicable(env) {
      const input = env.engine.context.input
      const pos = input.indexOf(CONDUCTOR_CODE)
      return input.length > 2 && pos > 1 && pos < input.length - 1
    }
    filter(candidates, env) {
      const input = env.engine.context.input
      const pos = input.indexOf(CONDUCTOR_CODE)
      if (pos < 1 || pos === input.length - 1) return candidates
      this.clearDisconnectedListeners()
      this.connectListenerToRimeContextIfNotYet(env.engine.context, env.id)
      const key = input.substring(pos + 1)
      const entries = (this.dict.prefixSearch(key) || []).map((it) => it.info)
      if (entries.length === 0) return candidates
      const matchedCandidates = []
      const others = []
      candidates.forEach((candidate) => {
        if (entries.includes(candidate.text)) {
          matchedCandidates.push(candidate)
        } else {
          others.push(candidate)
        }
      })
      return matchedCandidates.concat(others)
    }
    connectListenerToRimeContextIfNotYet(context, envId) {
      if (!this.selectListeners.some((it) => it.envId === envId)) {
        console.log('connecting listener to rime context', envId)
        const connection = context.selectNotifier.connect(onRimeSelectCallback)
        this.selectListeners.push({ envId, connection })
      }
    }
    clearDisconnectedListeners() {
      for (let i = this.selectListeners.length - 1; i >= 0; --i) {
        if (!this.selectListeners[i].connection.isConnected) {
          this.selectListeners[i].connection.disconnect()
          this.selectListeners.splice(i, 1)
        }
      }
    }
  }
  var CONDUCTOR_CODE = '`'
  function onRimeSelectCallback(context) {
    const input = context.input
    const pos = input.indexOf(CONDUCTOR_CODE)
    if (pos < 1) return
    const inputCode = input.substring(0, pos)
    const preedit = context.preedit.text
    let unselectedCode = preedit.replace(/[\u4e00-\u9fff]/g, '')
    unselectedCode = unselectedCode.substring(0, unselectedCode.indexOf(CONDUCTOR_CODE))
    if (unselectedCode.length > 0) {
      context.input = inputCode + CONDUCTOR_CODE
    } else {
      context.input = inputCode
      context.commit()
    }
  }
  globalThis.iife_instance_search_filter_iife_js = new SearchFilter()
})()
