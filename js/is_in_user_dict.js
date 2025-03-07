// 根据是否在用户词典，在结尾加上一个星号 *

//  -------------------------------------------------------
//  使用 JavaScript 实现，适配 librime-qjs 插件系统。
//  by @[HuangJian](https://github.com/HuangJian)

/**
 * Initialize the filter
 * @param {Environment} env - The Rime environment
 */
export function init(env) {
  console.log('is_in_user_dict.js init')
}

/**
 * Clean up when the filter is unloaded
 * @param {Environment} env - The Rime environment
 */
export function finit(env) {
  console.log('is_in_user_dict.js finit')
}

/**
 * Filter candidates to add special markers for user phrases and sentences
 * @param {Array<Candidate>} candidates - Array of candidates to filter
 * @param {Environment} env - The Rime environment
 * @returns {Array<Candidate>} The filtered candidates with markers added
 */
export function filter(candidates, env) {
  candidates.forEach(function (candidate) {
    if (candidate.type === 'user_phrase') {
      candidate.comment = '*'
    } else if (candidate.type === 'sentence') {
      candidate.comment = '∞'
    }
  })
  return candidates
}
