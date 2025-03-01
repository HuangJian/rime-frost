// 根据是否在用户词典，在结尾加上一个星号 *

//  -------------------------------------------------------
//  使用 JavaScript 实现，适配 librime-qjs 插件系统。
//  by @[HuangJian](https://github.com/HuangJian)

export function init() {
  console.log('is_in_user_dict.js init')
}
export function finit() {
  console.log('is_in_user_dict.js finit')
}
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
