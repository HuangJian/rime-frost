;(() => {
  var path = 'recognizer/patterns/unicode'
  var keyword = null
  var UnicodeTranslator = class {
    constructor(env) {
      console.log(`unicode translator init`)
      const pattern = env.engine.schema.config.getString(path) || '^U'
      keyword = pattern.substring(1, 2)
    }
    finalizer() {
      console.log(`unicode translator finit`)
    }
    translate(input, segment, env) {
      if (!segment.hasTag('unicode') || input.length < 3) return []
      const candidates = []
      const yieldCandidate = (text, comment) =>
        candidates.push(new Candidate('unicode', segment.start, segment.end, text, comment || ''))
      const match = input.match(new RegExp(keyword + '([0-9a-fA-F]+)'))
      if (match && match[1]) {
        const code = parseInt(match[1], 16)
        if (code > 1114111) {
          yieldCandidate(
            '\u6570\u503C\u8D85\u9650\uFF01',
            'Unicode \u7F16\u7801\u6700\u5927\u503C\u4E3A 0x10ffff',
          )
          return candidates
        }
        const text = String.fromCodePoint(code)
        yieldCandidate(text, `U${code.toString(16)}`)
        if (code < 65536) {
          for (let i = 0; i < 16; i++) {
            const text2 = String.fromCodePoint(code * 16 + i)
            yieldCandidate(text2, `U${code.toString(16)}~${i.toString(16)}`)
          }
        }
      }
      return candidates
    }
  }
  globalThis.iife_instance_unicode_translator_iife_js = new UnicodeTranslator()
})()
