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
  filter(candidates, env) {
    const fullPreedit = env.engine.context.input
    const letterOnlyPreedit = fullPreedit.replace(/[^a-zA-Z]/g, '')
    if (pinMap.size === 0 || letterOnlyPreedit.length === 0) {
      return candidates
    }
    const yields = []
    const pinedHolder = []
    const others = []
    let pinedSize = 0
    let i = 0
    for (; i < candidates.length; i++) {
      const candidate = candidates[i]
      const preedit = candidate.preedit.replaceAll(' ', '')
      const matchingWords = pinMap.get(preedit)
      if (!matchingWords) {
        if (letterOnlyPreedit === preedit) {
          yields.push(candidate)
        } else {
          others.push(candidate)
        }
        break
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
    const pinedCandidates = pinedHolder.map((it) => it.candidate).filter((it) => it)
    return [...yields, ...pinedCandidates, ...others, ...candidates.slice(i + 1)]
  }
}
function addPlaceHoldersToPinedHolder(pinedHolder, words) {
  words
    .filter((word) => !pinedHolder.some((it) => it.text === word))
    .forEach((word) => {
      pinedHolder.push({ text: word, candidate: null })
    })
}
export { PinCandidatesFilter }
