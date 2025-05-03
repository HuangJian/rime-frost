// 长词优先（提升「西安」「提案」「图案」「饥饿」等词汇的优先级）
// 感谢&参考于： https://github.com/tumuyan/rime-melt
// 不提升包含英文、数字的候选项
// 不提升包含 emoji、假名的候选项（通过将此 JS 放到 simplifier@emoji 前面来实现）
//  -------------------------------------------------------
//  使用 JavaScript 实现，适配 librime-qjs 插件系统。
//  by @[HuangJian](https://github.com/HuangJian)

// 提升 maxPromoteeSize 个词语，插入到第 startingIndex 个位置，默认 2、4。
/** @type {number} Number of candidates to promote */
let maxPromoteeSize = 2

/** @type {number} Position to insert promoted candidates */
let startingIndex = 4

/**
 * 长词优先过滤器
 * @implements {FastFilter}
 */
export class LongWordFilter {
  /**
   * Initialize the filter with configuration
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('long_word_filter.js init')
    const config = env.engine.schema.config
    // 不能写成 maxPromoteeSize = config.getInt(namespace + '/count') || 2
    // 因为 config.getInt() 可能返回 0，从而导致 maxPromoteeSize 被设置为 2。
    maxPromoteeSize = getConfigIntValueOrDefault(config, env.namespace + '/count', 2)
    startingIndex = getConfigIntValueOrDefault(config, env.namespace + '/idx', 4)
  }

  /**
   * Clean up when the filter is unloaded
   */
  finalizer() {
    console.log('long_word_filter.js finit')
  }

  /**
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    return env.engine.context.input.length > 3
  }

  /**
   * Filter and reorder candidates to prioritize longer words
   * @param {CandidateIterator} iter - The iterator of the candidates to process
   * @param {Environment} env - The Rime environment
   * @returns {Generator<Candidate, CandidateIterator | void>} The filtered and reordered candidates
   */
  *filter(iter, env) {
    let firstWordLength = 0 // 记录第一个候选词的长度，提前的候选词至少要比第一个候选词长

    const shortWords = []
    let founds = 0
    for (
      let idx = 0, candidate;
      // 找齐了或者 shortWords 太大了，就不找了，一般前 50 个就够了
      founds < maxPromoteeSize && shortWords.length <= 50 && (candidate = iter.next());
      idx++
    ) {
      const textLength = candidate.text.length
      if (firstWordLength < 1) {
        // 只以第一个候选项的长度作为参考
        firstWordLength = textLength
      }

      if (idx < startingIndex) {
        // 不处理 startingIndex 之前的候选项
        yield candidate
      } else if (textLength <= firstWordLength || /[a-zA-Z0-9]+/.test(candidate.text)) {
        // 收录短词
        shortWords.push(candidate)
      } else {
        // 长词直接 yield
        yield candidate
        founds++
      }
    }
    yield* shortWords
    return iter
  }
}

/**
 * Get integer value from config with fallback
 * @param {Config} config - Rime configuration object
 * @param {string} key - Configuration key to look up
 * @param {number} defaultValue - Default value if not found
 * @returns {number} The configured or default value
 */
function getConfigIntValueOrDefault(config, key, defaultValue) {
  const value = config.getInt(key)
  if (value === undefined || value === null) {
    return defaultValue
  }
  return value
}
