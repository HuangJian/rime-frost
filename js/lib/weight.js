import { unaccent } from './string.js'

/**
 * 计算候选项的权重分数，用于智能排序。
 *
 * @param {Object} candidate - 候选项对象
 * @param {string} inputCode - 用户输入的编码，不包含 /p 等快捷键
 * @returns {number} 权重分数，规则如下：
 * 1. 基础分值：
 *    - 拼音完全匹配：+10,000
 *    - 拼音前缀匹配：+5,000
 *    - 拼音部分包含：+1,000 + 拼音长度
 * 2. 用户词典加分：
 *    - 基础分值：+100,000 * min(词长, 4)
 *    - 找不到拼音但在用户词典中：视为完全匹配 +10,000
 * 3. 特殊类型：
 *    - 长句子类型：固定为 9,990,000
 *    - 四字及以上词语：若拼音前缀匹配，视为用户词典
 *
 * @example
 * // 完全匹配：输入 "shurufa" 匹配 "输入法"
 * ({text: "输入法", pinyin: "shū rù fǎ"}, "shurufa") // 返回 310,000 (10,000 + 100,000 * 3)
 *
 * // 前缀匹配：输入 "shuruf" 匹配 "输入法"
 * ({text: "输入法", pinyin: "shū rù fǎ"}, "shuruf") // 返回 305,000 (5,000 + 100,000 * 3)
 *
 * // 用户词典中的词：输入 "xinhuazidian" 匹配 "新华字典"
 * ({text: "新华字典", type: "user_phrase"}, "xinhuazidian") // 返回 410,000 (10,000 + 100,000 * 4)
 *
 * // 长句子类型
 * ({text: "这是一个很长的句子", type: "sentence"}, "zhe") // 返回 9,990,000
 */
export function getCandidateWeight(candidate, inputCode) {
    let weight = 0
    let isInUserPhrase = candidate.type === 'user_phrase'

    const pinyinNotFound = '~!@#$%^&'
    const unaccentedPinyin = candidate.pinyin
      ? unaccent(candidate.pinyin.replaceAll(' ', '')) // 已经从汉英词典里找到准确的带调拼音，直接使用
      : candidate.comment?.match(/^［(.*?)\］/)?.[1]?.replaceAll(' ', '') || // 雾凇拼音方案提供了不带调拼音，尝试从注解里提取。格式： `［pin yin］`
        pinyinNotFound

    if (unaccentedPinyin === pinyinNotFound && isInUserPhrase) {
      // 找不到拼音，但是在用户字典里。一般是用户自造词，权重应比普通字典词更高。就当成是完全匹配的拼音吧。
      weight += 10_000 // 完全匹配的拼音权重提高
    } else if (unaccentedPinyin === inputCode) {
      // 输入编码与候选项拼音完全匹配输入：shurufa ↹ 输入法 〘shū rù fǎ〙
      weight += 10_000 // 完全匹配的拼音权重提高
      isInUserPhrase = true // 视为用户词典
    } else if (unaccentedPinyin.startsWith(inputCode)) {
      // 输入编码前序匹配候选项的拼音： shuruf ↹ 输入法 〘shū rù fǎ〙
      weight += 5_000
      // 可能是成语，与用户词典等权重： huquyiz ↹ 虎躯一震 ［hu qu yi zhen］
      isInUserPhrase = isInUserPhrase || (!isInUserPhrase && candidate.text.length > 3)
    } else if (inputCode.includes(unaccentedPinyin)) {
      // 输入编码包含候选项的拼音： shurufaxuannajia ↹ 输入法 〘shū rù fǎ〙
      weight += 1_000 + unaccentedPinyin.length
    }

    if (isInUserPhrase) {
      // 用户词典优先级次高。
      // 当输入 xinhuazidian 时，「新华字典」在用户字典里，但找不到拼音。为防止被「新〘xīn〙」顶到后面，权重值需要考虑候选词长度。
      // 四字以上，权重一致。用例：jiuniuerh ↹ 1. 九牛二虎 ［jiu niu er hu］ 2. 九牛二虎之力 〘jiǔ niú èr hǔ zhī lì〙
      const multiplier = Math.min(candidate.text.length, 4)
      weight += 100_000 * multiplier
    } else if (candidate.type === 'sentence') {
      // 长句子优先级最高
      weight = 9_990_000
    }

    return weight
  }
