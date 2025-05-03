/**
 * 自动大写英文词汇：
 * - 输入首字母大写，候选词转换为首字母大写： Hello → Hello
 * - 输入至少前 2 个字母大写，候选词转换为全部大写： HEllo → HELLO
 *
 * @author https://github.com/HuangJian
 * @implements {FastFilter}
 */
export class AutoCapFilter {
  /**
   * Initialize the filter
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('autocap_filter.js init')
  }

  /**
   * Clean up the filter
   */
  finalizer() {
    console.log('autocap_filter.js finit')
  }

  /**
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    // 码长为 1 或 输入码首位为小写字母或标点，不转换：
    const input = env.engine.context.input
    return input.length === 1 || regPunctuationOrLowerAlphabetLeading.test(input)
  }

  /**
   * Filter candidates to apply automatic capitalization rules
   * @param {CandidateIterator} iter - The iterator of the candidates to process
   * @param {Environment} env - The Rime environment
   * @returns {Generator<Candidate, CandidateIterator | void>} The filtered candidates
   */
  *filter(iter, env) {
    const code = env.engine.context.input // 输入码
    const codeLen = code.length
    let codeAllUCase = false
    let codeUCase = false

    // 码长为 1 或 输入码首位为小写字母或标点，不转换：
    if (codeLen === 1 || regPunctuationOrLowerAlphabetLeading.test(code)) {
      return iter
    }

    // 仅尝试转换前 100 个候选词，提高性能
    for (let idx = 0, candidate; idx < 100 && (candidate = iter.next()); idx++) {
      if (reg2plusUpperAlphabetsLeading.test(code)) {
        // 输入码前 2 - n 位大写
        codeAllUCase = true
      } else if (regSingleUpperAlphabetLeading.test(code)) {
        // 输入码首位大写
        codeUCase = true
      } else {
        yield candidate
        continue
      }

      const pureCode = code.replace(regPunctuationsAndSpaces, '').toLowerCase() // 删除标点和空格的输入码
      let text = candidate.text // 候选词
      const pureText = text.replace(regPunctuationsAndSpaces, '') // 删除标点和空格的候选词

      if (
        regHasNonAlphanumericPuncuationSpace.test(text) || // 候选词包含非字母和数字、非标点符号、非空格的字符
        reghasSpace.test(text) || // 候选词中包含空格
        pureText.startsWith(code) || // 输入码完全匹配候选词
        (candidate.type !== 'completion' && // 单词与其对应的编码不一致
          !pureText.toLowerCase().startsWith(pureCode)) // 例如 PS - Photoshop
      ) {
        yield candidate // 不做转换
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
