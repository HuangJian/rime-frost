;(() => {
  var MAPPINGS = {
    UNITS: {
      SMALL: ['', '\u5341', '\u767E', '\u5343'],
      LARGE: ['', '\u4E07', '\u4EBF'],
      DECIMAL: ['\u89D2', '\u5206', '\u5398', '\u6BEB'],
    },
    DIGITS: {
      SIMPLIFIED: [
        '\u3007',
        '\u4E00',
        '\u4E8C',
        '\u4E09',
        '\u56DB',
        '\u4E94',
        '\u516D',
        '\u4E03',
        '\u516B',
        '\u4E5D',
      ],
      TRADITIONAL: [
        '\u96F6',
        '\u58F9',
        '\u8D30',
        '\u53C1',
        '\u8086',
        '\u4F0D',
        '\u9646',
        '\u67D2',
        '\u634C',
        '\u7396',
      ],
    },
  }
  function splitNumber(str) {
    const [, int = '', dot = '', dec = ''] = str.match(/^(\d*)(\.)?(\d*)$/) || []
    return { int, dot, dec }
  }
  function formatDecimal(str, isTraditional = false) {
    console.log(`formatDecimal: ${str}`)
    if (!str || str === '0') return ''
    const digits = isTraditional ? MAPPINGS.DIGITS.TRADITIONAL : MAPPINGS.DIGITS.SIMPLIFIED
    const units = MAPPINGS.UNITS.DECIMAL
    let result = ''
    const cleanDec = str.slice(0, 4).replace(/0+$/, '')
    for (let i = 0; i < cleanDec.length; i++) {
      const val = Number(cleanDec[i])
      if (val !== 0) {
        result += digits[val] + units[i]
      } else {
        result += digits[0]
      }
    }
    return result
      .replace(new RegExp(`${digits[0]}+`, 'g'), digits[0])
      .replace(new RegExp(`${digits[0]}$`), '')
  }
  function formatInteger(num, isTraditional = false) {
    const digits = isTraditional ? MAPPINGS.DIGITS.TRADITIONAL : MAPPINGS.DIGITS.SIMPLIFIED
    const smallUnits = isTraditional ? ['', '\u62FE', '\u4F70', '\u4EDF'] : MAPPINGS.UNITS.SMALL
    const largeUnits = isTraditional ? ['', '\u842C', '\u5104'] : MAPPINGS.UNITS.LARGE
    if (Number(num) === 0) return digits[0]
    const numStr = String(num)
    if (numStr.length > 12) return ''
    function formatGroup(group) {
      if (!group || Number(group) === 0) return ''
      let result2 = ''
      for (let i = 0; i < group.length; i++) {
        const val = Number(group[i])
        const pos = group.length - 1 - i
        if (val === 0) {
          if (result2 && result2[result2.length - 1] !== digits[0]) {
            result2 += digits[0]
          }
        } else {
          if (!(val === 1 && pos === 1 && group.length === 2)) {
            result2 += digits[val]
          }
          result2 += smallUnits[pos]
        }
      }
      return result2
    }
    const groups = []
    for (let i = numStr.length; i > 0; i -= 4) {
      groups.unshift(numStr.slice(Math.max(0, i - 4), i))
    }
    let result = ''
    groups.forEach((group, index) => {
      const groupText = formatGroup(group)
      if (groupText) {
        result += groupText + (index < groups.length - 1 ? largeUnits[groups.length - 1 - index] : '')
      }
    })
    result = result.replace(new RegExp(`${digits[0]}+`, 'g'), digits[0])
    return result.replace(new RegExp(`${digits[0]}$`), '') || digits[0]
  }
  function translateNumber(num) {
    const { int, dot, dec } = splitNumber(num)
    const results = []
    const intSimp = formatInteger(int, false)
    const intTrad = formatInteger(int, true)
    if (dot) {
      const decTextSimplified = dec
        .split('')
        .map((d) => MAPPINGS.DIGITS.SIMPLIFIED[Number(d)])
        .join('')
      results.push([`${intSimp}\u70B9${decTextSimplified}`, '\u3014\u6570\u5B57\u5C0F\u5199\u3015'])
      const decTextTraditional = dec
        .split('')
        .map((d) => MAPPINGS.DIGITS.TRADITIONAL[Number(d)])
        .join('')
      results.push([`${intTrad}\u70B9${decTextTraditional}`, '\u3014\u6570\u5B57\u5927\u5199\u3015'])
    } else {
      results.push([intSimp, '\u3014\u6570\u5B57\u5C0F\u5199\u3015'])
      results.push([intTrad, '\u3014\u6570\u5B57\u5927\u5199\u3015'])
    }
    const suffix = parseInt(num) === 0 ? '' : '\u6574'
    results.push([
      intSimp + '\u5143' + (dec ? formatDecimal(dec, false) : suffix),
      '\u3014\u91D1\u989D\u5C0F\u5199\u3015',
    ])
    results.push([
      intTrad + '\u5143' + (dec ? formatDecimal(dec, true) : suffix),
      '\u3014\u91D1\u989D\u5927\u5199\u3015',
    ])
    return results
  }
  var path = 'recognizer/patterns/number'
  var keyword = null
  var NumberTranslator = class {
    constructor(env) {
      console.log(`number translator init`)
      const pattern = env.engine.schema.config.getString(path) || '^R'
      keyword = pattern.substring(1, 2)
    }
    finalizer() {
      console.log(`number translator finit`)
    }
    translate(input, segment, env) {
      if (!keyword || input[0] !== keyword) return []
      const number = input.replace(/^[a-zA-Z]+/, '')
      if (!number) return []
      return translateNumber(number).map(
        ([text, comment]) => new Candidate('number', segment.start, segment.end, text, comment),
      )
    }
  }
  globalThis.iife_instance_number_translator_iife_js = new NumberTranslator()
})()
