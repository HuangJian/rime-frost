var regPunctuationsAndSpaces = /[\s\p{P}]/gu
var regPunctuationOrLowerAlphabetLeading = /^[a-z\p{P}]/u
var reg2plusUpperAlphabetsLeading = /^[A-Z]{2,}.*$/
var regSingleUpperAlphabetLeading = /^[A-Z].*$/
var regHasNonAlphanumericPuncuationSpace = /[^\w\p{P}\s]/u
var reghasSpace = /\s/
var AutoCapFilter = class {
  constructor(env) {
    console.log('autocap_filter.js init')
  }
  finalizer() {
    console.log('autocap_filter.js finit')
  }
  filter(candidates, env) {
    const code = env.engine.context.input
    const codeLen = code.length
    let codeAllUCase = false
    let codeUCase = false
    if (codeLen === 1 || regPunctuationOrLowerAlphabetLeading.test(code)) {
      return candidates
    }
    if (reg2plusUpperAlphabetsLeading.test(code)) {
      codeAllUCase = true
    } else if (regSingleUpperAlphabetLeading.test(code)) {
      codeUCase = true
    } else {
      return candidates
    }
    const pureCode = code.replace(regPunctuationsAndSpaces, '').toLowerCase()
    return candidates.map((candidate) => {
      let text = candidate.text
      const pureText = text.replace(regPunctuationsAndSpaces, '')
      if (
        regHasNonAlphanumericPuncuationSpace.test(text) ||
        reghasSpace.test(text) ||
        pureText.startsWith(code) ||
        (candidate.type !== 'completion' && !pureText.toLowerCase().startsWith(pureCode))
      ) {
        return candidate
      }
      const newText = codeAllUCase ? text.toUpperCase() : text[0].toUpperCase() + text.slice(1)
      return new Candidate(
        candidate.type,
        candidate.start,
        candidate.end,
        newText,
        candidate.comment || '',
        candidate.quality,
      )
    })
  }
}
export { AutoCapFilter }
