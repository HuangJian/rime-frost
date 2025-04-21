;(() => {
  var charsets = {
    CJK: { first: 19968, last: 40959 },
    ExtA: { first: 13312, last: 19903 },
    ExtB: { first: 131072, last: 173791 },
    ExtC: { first: 173824, last: 177983 },
    ExtD: { first: 177984, last: 178207 },
    ExtE: { first: 178208, last: 183983 },
    ExtF: { first: 183984, last: 191471 },
    Compat: { first: 194560, last: 195103 },
  }
  function isCjkExt(char) {
    const charPoint = char.codePointAt(0)
    return [charsets.ExtB, charsets.ExtC, charsets.ExtD, charsets.ExtE, charsets.ExtF].some(
      (charset) => charPoint >= charset.first && charPoint <= charset.last,
    )
  }
  var CharsetFilter = class {
    constructor(env) {
      console.log('charset_filter init')
    }
    finalizer() {
      console.log('charset_filter finit')
    }
    filter(candidates, env) {
      return candidates.filter((item) => {
        return !Array.from(item.text).some(isCjkExt)
      })
    }
  }
  globalThis.iife_instance_charset_filter_iife_js = new CharsetFilter()
})()
