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
 * Initialize the filter with configuration
 * @param {Environment} env - The Rime environment
 */
export function init(env) {
  console.log('long_word_filter.js init')
  const config = env.engine.schema.config
  // 不能写成 maxPromoteeSize = config.getInt(namespace + '/count') || 2
  // 因为 config.getInt() 可能返回 0，从而导致 maxPromoteeSize 被设置为 2。
  maxPromoteeSize = getConfigIntValueOrDefault(config, env.namespace + '/count', 2)
  startingIndex = getConfigIntValueOrDefault(config, env.namespace + '/idx', 4)
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

/**
 * Filter and reorder candidates to prioritize longer words
 * @param {Array<Candidate>} candidates - Array of candidates to filter
 * @returns {Array<Candidate>} Reordered candidates with longer words promoted
 */
export function filter(candidates) {
  let firstWordLength = 0 // 记录第一个候选词的长度，提前的候选词至少要比第一个候选词长

  const ret = []
  const shortWords = []
  const others = []
  let founds = 0
  candidates.forEach((candidate, idx) => {
    // 找齐了或者 shortWords 太大了，就不找了，一般前 50 个就够了
    if (founds >= maxPromoteeSize || shortWords.length > 50) {
      others.push(candidate)
      return
    }

    const textLength = candidate.text.length
    if (firstWordLength < 1) {
      // 只以第一个候选项的长度作为参考
      firstWordLength = textLength
    }

    if (idx < startingIndex) {
      // 不处理 startingIndex 之前的候选项
      ret.push(candidate)
    } else if (textLength <= firstWordLength || /[a-zA-Z0-9]+/.test(candidate.text)) {
      // 收录短词
      shortWords.push(candidate)
    } else {
      // 长词直接 yield
      ret.push(candidate)
      founds++
    }
  })
  ret.push(...shortWords)
  ret.push(...others)

  return ret
}
