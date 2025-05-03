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
    *filter(iter, env) {
      let firstWordLength = 0
      const shortWords = []
      let founds = 0
      for (
        let idx = 0, candidate;
        founds < maxPromoteeSize && shortWords.length <= 50 && (candidate = iter.next());
        idx++
      ) {
        const textLength = candidate.text.length
        if (firstWordLength < 1) {
          firstWordLength = textLength
        }
        if (idx < startingIndex) {
          yield candidate
        } else if (textLength <= firstWordLength || /[a-zA-Z0-9]+/.test(candidate.text)) {
          shortWords.push(candidate)
        } else {
          yield candidate
          founds++
        }
      }
      yield* shortWords
      return iter
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
