/**
 * 自动大写英文词汇：
 * - 部分规则不做转换
 * - 输入首字母大写，候选词转换为首字母大写： Hello → Hello
 * - 输入至少前 2 个字母大写，候选词转换为全部大写： HEllo → HELLO
 *
 * 大写时无法动态调整词频
 * -------------------------------------------------------
 * 使用 JavaScript 实现，适配 librime-qjs 插件系统。
 * by @[HuangJian](https://github.com/HuangJian)
 */

// 此正则表达式使用 Unicode 属性转义检测字符串中是否含有标点符号和空格。
// \p{P} 匹配所有的标点符号。'u' 标志启用 Unicode 模式。
const regPunctuationsAndSpaces = /[\s\p{P}]/gu

// 首位为小写字母或标点符号的正则表达式
const regPunctuationOrLowerAlphabetLeading = /^[a-z\p{P}]/u

// 前 2 - n 位大写的正则表达式
const reg2plusUpperAlphabetsLeading = /^[A-Z]{2,}.*$/

// 首位大写的正则表达式
const regSingleUpperAlphabetLeading = /^[A-Z].*$/

// 包含非字母和数字、非标点符号、非空格的字符的正则表达式
const regHasNonAlphanumericPuncuationSpace = /[^\w\p{P}\s]/u

// 包含空格的正则表达式
const reghasSpace = /\s/

/**
 * Filter candidates to apply automatic capitalization rules
 * @param {Array<Candidate>} candidates - The candidates to process
 * @param {Environment} env - The Rime environment
 * @returns {Array<Candidate>} Processed candidates with appropriate capitalization
 */
export function filter(candidates, env) {
  const code = env.engine.context.input // 输入码
  const codeLen = code.length
  let codeAllUCase = false
  let codeUCase = false

  // 码长为 1 或 输入码首位为小写字母或标点，不转换：
  if (codeLen === 1 || regPunctuationOrLowerAlphabetLeading.test(code)) {
    return candidates
  }

  if (reg2plusUpperAlphabetsLeading.test(code)) {
    // 输入码前 2 - n 位大写
    codeAllUCase = true
  } else if (regSingleUpperAlphabetLeading.test(code)) {
    // 输入码首位大写
    codeUCase = true
  } else {
    return candidates
  }

  const pureCode = code.replace(regPunctuationsAndSpaces, '').toLowerCase() // 删除标点和空格的输入码

  return candidates.map((candidate) => {
    let text = candidate.text // 候选词
    const pureText = text.replace(regPunctuationsAndSpaces, '') // 删除标点和空格的候选词

    if (
      regHasNonAlphanumericPuncuationSpace.test(text) || // 候选词包含非字母和数字、非标点符号、非空格的字符
      reghasSpace.test(text) || // 候选词中包含空格
      pureText.startsWith(code) || // 输入码完全匹配候选词
      (candidate.type !== 'completion' && // 单词与其对应的编码不一致
        !pureText.toLowerCase().startsWith(pureCode)) // 例如 PS - Photoshop
    ) {
      return candidate // 不做转换
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

/**
 * Initialize the filter
 * @param {Environment} env - The Rime environment
 */
export function init(env) {
  console.log('autocap_filter.js init')
}

/**
 * Clean up the filter
 * @param {Environment} env - The Rime environment
 */
export function finit(env) {
  console.log('autocap_filter.js finit')
}
