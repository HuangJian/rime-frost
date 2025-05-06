;(() => {
  var AutoCapFilter = class {
    constructor(env) {
      console.log('autocap_filter.js init')
    }
    finalizer() {
      console.log('autocap_filter.js finit')
    }
    isApplicable(env) {
      const input = env.engine.context.input
      return input.length > 1 && !regPunctuationOrLowerAlphabetLeading.test(input)
    }
    *filter(iter, env) {
      const code = env.engine.context.input
      const codeLen = code.length
      let codeAllUCase = false
      let codeUCase = false
      if (codeLen === 1 || regPunctuationOrLowerAlphabetLeading.test(code)) {
        return iter
      }
      for (let idx = 0, candidate; idx < 100 && (candidate = iter.next()); idx++) {
        if (reg2plusUpperAlphabetsLeading.test(code)) {
          codeAllUCase = true
        } else if (regSingleUpperAlphabetLeading.test(code)) {
          codeUCase = true
        } else {
          yield candidate
          continue
        }
        const pureCode = code.replace(regPunctuationsAndSpaces, '').toLowerCase()
        let text = candidate.text
        const pureText = text.replace(regPunctuationsAndSpaces, '')
        if (
          regHasNonAlphanumericPuncuationSpace.test(text) ||
          reghasSpace.test(text) ||
          pureText.startsWith(code) ||
          (candidate.type !== 'completion' && !pureText.toLowerCase().startsWith(pureCode))
        ) {
          yield candidate
          continue
        }
        const newText = codeAllUCase ? text.toUpperCase() : text[0].toUpperCase() + text.slice(1)
        yield new Candidate(
          candidate.type,
          candidate.start,
          candidate.end,
          newText,
          candidate.comment || '',
          candidate.quality,
        )
      }
      return iter
    }
  }
  var regPunctuationsAndSpaces = /[\s\p{P}]/gu
  var regPunctuationOrLowerAlphabetLeading = /^[a-z\p{P}]/u
  var reg2plusUpperAlphabetsLeading = /^[A-Z]{2,}.*$/
  var regSingleUpperAlphabetLeading = /^[A-Z].*$/
  var regHasNonAlphanumericPuncuationSpace = /[^\w\p{P}\s]/u
  var reghasSpace = /\s/
  globalThis.iife_instance_autocap_filter_iife_js = new AutoCapFilter()
})()
