;(() => {
  var maxPromoteeSize = 2
  var startingIndex = 4
  var LongWordFilter = class {
    constructor(env) {
      console.log('long_word_filter.js init')
      const config = env.engine.schema.config
      maxPromoteeSize = getConfigIntValueOrDefault(config, env.namespace + '/count', 2)
      startingIndex = getConfigIntValueOrDefault(config, env.namespace + '/idx', 4)
    }
    finalizer() {
      console.log('long_word_filter.js finit')
    }
    isApplicable(env) {
      return env.engine.context.input.length > 3
    }
    filter(candidates) {
      let firstWordLength = 0
      const ret = []
      const shortWords = []
      const others = []
      let founds = 0
      candidates.forEach((candidate, idx) => {
        if (founds >= maxPromoteeSize || shortWords.length > 50) {
          others.push(candidate)
          return
        }
        const textLength = candidate.text.length
        if (firstWordLength < 1) {
          firstWordLength = textLength
        }
        if (idx < startingIndex) {
          ret.push(candidate)
        } else if (textLength <= firstWordLength || /[a-zA-Z0-9]+/.test(candidate.text)) {
          shortWords.push(candidate)
        } else {
          ret.push(candidate)
          founds++
        }
      })
      ret.push(...shortWords)
      ret.push(...others)
      return ret
    }
  }
  function getConfigIntValueOrDefault(config, key, defaultValue) {
    const value = config.getInt(key)
    if (value === void 0 || value === null) {
      return defaultValue
    }
    return value
  }
  globalThis.iife_instance_long_word_filter_iife_js = new LongWordFilter()
})()
