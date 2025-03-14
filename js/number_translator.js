// 来源 https://github.com/yanhuacuo/98wubi-tables > http://98wb.ysepan.com/
// 数字、金额大写
// 触发前缀默认为 recognizer/patterns/number 的第 2 个字符，即 R
// -------------------------------------------------------
// 使用 JavaScript 重写，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

/**
 * @typedef {Object} NumberMappings
 * @description 数字转换映射表，包含单位和数字的中文映射
 * @property {Object} UNITS - 单位映射对象
 * @property {string[]} UNITS.SMALL - 个位数单位：['', '十', '百', '千']
 * @property {string[]} UNITS.LARGE - 大数单位：['', '万', '亿']
 * @property {string[]} UNITS.DECIMAL - 小数单位：['角', '分', '厘', '毫']
 * @property {Object} DIGITS - 数字映射对象
 * @property {string[]} DIGITS.SIMPLIFIED - 简体中文数字
 * @property {string[]} DIGITS.TRADITIONAL - 繁体中文数字
 */
const MAPPINGS = {
  UNITS: {
    SMALL: ['', '十', '百', '千'],
    LARGE: ['', '万', '亿'],
    DECIMAL: ['角', '分', '厘', '毫'],
  },
  DIGITS: {
    SIMPLIFIED: ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'],
    TRADITIONAL: ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'],
  },
}

/**
 * 将数字字符串拆分为整数部分、小数点和小数部分
 * @param {string} str - 需要拆分的数字字符串
 * @returns {Object} 包含整数、小数点和小数部分的对象
 * @property {string} int - 整数部分
 * @property {string} dot - 小数点（如果有）
 * @property {string} dec - 小数部分（如果有）
 */
function splitNumber(str) {
  const [, int = '', dot = '', dec = ''] = str.match(/^(\d*)(\.)?(\d*)$/) || []
  return { int, dot, dec }
}

/**
 * 格式化数字的小数部分为中文表示
 * @param {string} str - 需要格式化的小数部分字符串
 * @param {boolean} [isTraditional=false] - 是否使用繁体字体
 * @returns {string} 格式化后的中文小数表示
 * @example
 * formatDecimal('25') // 返回 '二角五分'
 * formatDecimal('25', true) // 返回 '贰角伍分'
 */
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

  return result.replace(new RegExp(`${digits[0]}+`, 'g'), digits[0]).replace(new RegExp(`${digits[0]}$`), '')
}

/**
 * 将整数转换为中文数字表示
 * @param {number|string} num - 需要转换的整数
 * @param {boolean} [isTraditional=false] - 是否使用繁体字体
 * @returns {string} 转换后的中文数字
 * @example
 * formatInteger(123) // 返回 '一百二十三'
 * formatInteger(123, true) // 返回 '壹佰贰拾叁'
 */
function formatInteger(num, isTraditional = false) {
  const digits = isTraditional ? MAPPINGS.DIGITS.TRADITIONAL : MAPPINGS.DIGITS.SIMPLIFIED
  const smallUnits = isTraditional ? ['', '拾', '佰', '仟'] : MAPPINGS.UNITS.SMALL
  const largeUnits = isTraditional ? ['', '萬', '億'] : MAPPINGS.UNITS.LARGE

  if (Number(num) === 0) return digits[0]

  const numStr = String(num)
  if (numStr.length > 12) return ''

  function formatGroup(group) {
    if (!group || Number(group) === 0) return ''

    let result = ''
    for (let i = 0; i < group.length; i++) {
      const val = Number(group[i])
      const pos = group.length - 1 - i

      if (val === 0) {
        if (result && result[result.length - 1] !== digits[0]) {
          result += digits[0]
        }
      } else {
        if (!(val === 1 && pos === 1 && group.length === 2)) {
          result += digits[val]
        }
        result += smallUnits[pos]
      }
    }

    return result
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

/**
 * 将数字转换为多种中文表示形式
 * @param {string} num - 需要转换的数字字符串
 * @returns {Array<[string, string]>} 转换结果数组，每个元素为 [转换结果, 说明标签]
 * @example
 * translateNumber('123.45') 返回：
 * [
 *   ['一百二十三点四五', '〔数字小写〕'],
 *   ['壹佰贰拾叁点肆伍', '〔数字大写〕'],
 *   ['一百二十三元四角五分', '〔金额小写〕'],
 *   ['壹佰贰拾叁元肆角伍分', '〔金额大写〕']
 * ]
 */
function translateNumber(num) {
  const { int, dot, dec } = splitNumber(num)
  const results = []

  // Add number translations (simplified and traditional)
  const intSimp = formatInteger(int, false)
  const intTrad = formatInteger(int, true)

  if (dot) {
    const decTextSimplified = dec
      .split('')
      .map((d) => MAPPINGS.DIGITS.SIMPLIFIED[Number(d)])
      .join('')
    results.push([`${intSimp}点${decTextSimplified}`, '〔数字小写〕'])

    const decTextTraditional = dec
      .split('')
      .map((d) => MAPPINGS.DIGITS.TRADITIONAL[Number(d)])
      .join('')
    results.push([`${intTrad}点${decTextTraditional}`, '〔数字大写〕'])
  } else {
    results.push([intSimp, '〔数字小写〕'])
    results.push([intTrad, '〔数字大写〕'])
  }

  // Add currency translations
  const suffix = parseInt(num) === 0 ? '' : '整'
  results.push([intSimp + '元' + (dec ? formatDecimal(dec, false) : suffix), '〔金额小写〕'])
  results.push([intTrad + '元' + (dec ? formatDecimal(dec, true) : suffix), '〔金额大写〕'])

  // @ts-ignore
  return results
}

const path = 'recognizer/patterns/number'
let keyword = null

/**
 * 数字、金额大写翻译器
 * @implements {Translator}
 */
export class NumberTranslator {
  /**
   * 初始化数字转换模块
   * @param {Object} env - Rime 输入法引擎环境对象
   * @description 从配置中获取触发前缀，默认为 'R'
   */
  constructor(env) {
    console.log(`number translator init`)

    // 获取 recognizer/patterns/number 的第 2 个字符作为触发前缀
    const pattern = env.engine.schema.config.getString(path) || '^R'
    keyword = pattern.substring(1, 2)
  }

  /**
   * 清理数字转换模块
   */
  finalizer() {
    console.log(`number translator finit`)
  }

  /**
   * 执行数字转换
   * @param {string} input - 输入字符串
   * @param {Segment} segment - 切分片段对象
   * @param {Object} env - Rime 输入法引擎环境对象
   * @returns {Array<Candidate>} 候选项数组
   * @description 将以触发前缀开头的数字转换为对应的中文表示
   */
  translate(input, segment, env) {
    if (!keyword || input[0] !== keyword) return []

    const number = input.replace(/^[a-zA-Z]+/, '')
    if (!number) return []

    return translateNumber(number).map(
      ([text, comment]) => new Candidate('number', segment.start, segment.end, text, comment),
    )
  }
}
