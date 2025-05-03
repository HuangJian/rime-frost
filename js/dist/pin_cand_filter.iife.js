;(() => {
  var pinMap = new Map()
  var PinCandidatesFilter = class {
    constructor(env) {
      console.log('pin_cand_filter init')
      const namespace = env.namespace.replace(/^\*/, '')
      if (pinMap.entries.length > 0) return
      const list = env.engine.schema.config.getList(namespace)
      if (!list || list.getSize() === 0) return
      const set = new Set()
      for (let i = 0; i < list.getSize(); i++) {
        const item = list.getValueAt(i).getString()
        const [_, preedit, texts] = item.match(/^(.+?)\t(.+)$/) || []
        if (preedit?.length > 0 && texts?.length > 0) {
          set.add(preedit.replaceAll(' ', ''))
        }
      }
      for (let i = 0; i < list.getSize(); i++) {
        const item = list.getValueAt(i).getString()
        let [_, preedit, texts] = item.match(/^(.+?)\t(.+)$/) || []
        if (preedit?.length > 0 && texts?.length > 0) {
          const words = texts.includes(' > ') ? texts.split(' > ') : texts.split(' ')
          const preeditNoSpaces = preedit.replace(/ /g, '')
          pinMap.set(preeditNoSpaces, words)
          if (preedit.includes(' ')) {
            const [_2, precedingPart, lastPart] = preedit.match(/^(.+)\s(\S+)$/)
            const p1 = precedingPart.replace(/ /g, '') + lastPart.charAt(0)
            let p2 = ''
            if (/^[zcs]h/.test(lastPart)) {
              p2 = precedingPart.replace(/ /g, '') + lastPart.substring(0, 2)
            }
            ;[p1, p2].forEach((p) => {
              if (p !== '' && !set.has(p)) {
                if (pinMap.has(p)) {
                  words.forEach((text) => {
                    pinMap.get(p).push(text)
                  })
                } else {
                  pinMap.set(p, pinMap[preeditNoSpaces])
                }
              }
            })
          }
        }
      }
    }
    isApplicable(env) {
      if (pinMap.size === 0) return false
      const fullPreedit = env.engine.context.preedit.text
      return fullPreedit.replace(/[^a-zA-Z]/g, '').length > 0
    }
    *filter(iter, env) {
      const fullPreedit = env.engine.context.preedit.text
      const letterOnlyPreedit = fullPreedit.replace(/[^a-zA-Z]/g, '')
      if (pinMap.size === 0 || letterOnlyPreedit.length === 0) {
        return iter
      }
      const pinedHolder = []
      const others = []
      let pinedSize = 0
      for (let i = 0, candidate; (candidate = iter.next()); i++) {
        const preedit = candidate.preedit.replaceAll(' ', '')
        const matchingWords = pinMap.get(preedit)
        if (!matchingWords) {
          if (letterOnlyPreedit === preedit) {
            yield candidate
            break
          } else {
            others.push(candidate)
            continue
          }
        }
        addPlaceHoldersToPinedHolder(pinedHolder, matchingWords)
        const itemToPin = pinedHolder.find((it) => it.text === candidate.text)
        if (itemToPin) {
          pinedSize++
          itemToPin.candidate = candidate
          candidate.comment = '\u{1F4CC}' + candidate.comment
        } else {
          others.push(candidate)
        }
        if (pinedSize === matchingWords.length || others.length > 100) {
          break
        }
      }
      const pins = pinedHolder.map((it) => it.candidate).filter((it) => it)
      yield* pins
      yield* others
      return iter
    }
  }
  function addPlaceHoldersToPinedHolder(pinedHolder, words) {
    words
      .filter((word) => !pinedHolder.some((it) => it.text === word))
      .forEach((word) => {
        pinedHolder.push({ text: word, candidate: null })
      })
  }
  globalThis.iife_instance_pin_cand_filter_iife_js = new PinCandidatesFilter()
})()
