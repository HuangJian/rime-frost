// charset_filter: 滤除含 CJK 扩展汉字的候选项，避免候选框中出现不可见的字符集。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

// Charset definitions for CJK characters
const charsets = {
  CJK: { first: 0x4e00, last: 0x9fff }, // CJK Unified Ideographs, like 你 (U+4E00), 好 (U+4E01)
  ExtA: { first: 0x3400, last: 0x4dbf }, // CJK Unified Ideographs Extension A, like ㄅ (U+3400), ㄆ (U+3401)
  ExtB: { first: 0x20000, last: 0x2a6df }, // CJK Unified Ideographs Extension B, like 𠀀 (U+20000), 𠀁 (U+20001)
  ExtC: { first: 0x2a700, last: 0x2b73f }, // CJK Unified Ideographs Extension C, like 𩸀 (U+2A700), 𩸁 (U+2A701)
  ExtD: { first: 0x2b740, last: 0x2b81f }, // CJK Unified Ideographs Extension D, like 𪠀 (U+2B740), 𪠁 (U+2B741)
  ExtE: { first: 0x2b820, last: 0x2ceaf }, // CJK Unified Ideographs Extension E, like 𫠀 (U+2B820), 𫠁 (U+2B821)
  ExtF: { first: 0x2ceb0, last: 0x2ebef }, // CJK Unified Ideographs Extension F, like 𫰀 (U+2CEB0), 𫰁 (U+2CEB1)
  Compat: { first: 0x2f800, last: 0x2fa1f }, // CJK Compatibility Ideographs, like 〇 (U+2F800), 一 (U+2F801)
}

/**
 * Check if a character is a CJK extension character
 * @param {string} char - The character to check
 * @returns {boolean} True if the character is a CJK extension character
 */
function isCjkExt(char) {
  const charPoint = char.codePointAt(0)
  return [charsets.ExtB, charsets.ExtC, charsets.ExtD, charsets.ExtE, charsets.ExtF].some(
    (charset) => charPoint >= charset.first && charPoint <= charset.last,
  )
}

/**
 * 不可见字符集过滤器
 * @implements {Filter}
 */
export class CharsetFilter {
  /**
   * Initialize the filter
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('charset_filter init')
  }

  /**
   * Clean up the filter
   * @param {Environment} env - The Rime environment
   */
  finalizer(env) {
    console.log('charset_filter finit')
  }

  /**
   * Filter out candidates containing CJK extension characters
   * @param {Array<Candidate>} candidates - The candidates to filter
   * @param {Environment} env - The Rime environment
   * @returns {Array<Candidate>} Filtered candidates
   */
  filter(candidates, env) {
    return candidates.filter((item) => {
      return !Array.from(item.text).some(isCjkExt)
    })
  }
}
