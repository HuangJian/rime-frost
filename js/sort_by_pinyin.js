import { unaccent } from './lib/string.js'

/**
 * 根据候选项的拼音和输入字符的匹配程度，重新排序候选项。
 *  仅对带拼音的候选项进行就地重排，其它类型的候选项（长句子、emoji、英语单词等）保持原顺序。
 * @implements {Filter}
 * @author https://github.com/HuangJian
 */
export class SortCandidatesByPinyinFilter {
  /**
   * Initialize the filter
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('sort_by_pinyin.js init')
  }

  /**
   * Clean up when the filter is unloaded
   */
  finalizer() {
    console.log('sort_by_pinyin.js finit')
  }

  /**
   * the number of top candidates to sort
   */
  #topN = 100

  /**
   * Sort the candidates by pinyin
   * @param {Array<Candidate>} candidates - Array of candidates to sort
   * @param {Environment} env - The Rime environment
   * @returns {Array<Candidate>} The sorted candidates
   */
  filter(candidates, env) {
    const userPhrases = []
    const userPhrasesIndices = []
    const candidatesWithPinyin = []
    const candidatesWithPinyinIndices = []

    const input = env.engine.context.input.replace(/\/.*$/, '') // 去掉 /py /en 等快捷键

    const size = candidates.length > this.#topN ? this.#topN : candidates.length
    candidates.slice(0, size).forEach((candidate, idx) => {
      const pinyin = this.extractPinyin(candidate.comment)?.replaceAll(' ', '')
      if (candidate.type === 'user_phrase') {
        const weight = this.getWeightByPinyin(pinyin, input, true) + size - idx
        userPhrasesIndices.push(idx)
        userPhrases.push({ candidate, weight })
      } else if (pinyin) {
        const weight = this.getWeightByPinyin(pinyin, input, false) + size - idx
        candidatesWithPinyinIndices.push(idx)
        candidatesWithPinyin.push({ candidate, weight })
      }
    })

    // 就地重排用户词典的候选词
    userPhrases.sort((a, b) => b.weight - a.weight)
    userPhrasesIndices.forEach((originalIndex, idx) => {
      candidates[originalIndex] = userPhrases[idx].candidate
    })

    // 就地重排其它带拼音的候选词
    candidatesWithPinyin.sort((a, b) => b.weight - a.weight)
    candidatesWithPinyinIndices.forEach((originalIndex, idx) => {
      candidates[originalIndex] = candidatesWithPinyin[idx].candidate
    })

    return candidates
  }
  /**
   * 计算候选项的权重分数，用于智能排序。
   *
   * @param {string | undefined} pinyin - 候选项的不带调拼音，不包含空格
   * @param {string} input - 用户输入的编码，不包含 /py 等快捷键
   * @param {boolean} isInUserPhrase - 候选项是否在用户词典中
   * @returns {number} 权重分数，规则如下：
   *    - 拼音完全匹配：+10,000
   *    - 拼音前缀匹配：+5,000
   *    - 拼音部分包含：+1,000 + 拼音长度
   *    - 找不到拼音但在用户词典中：视为完全匹配 +10,000
   *    - 其它情况：0
   */
  getWeightByPinyin(pinyin, input, isInUserPhrase) {
    if (pinyin === input) {
      return 10000
    }
    if (isInUserPhrase && !pinyin) {
      return 10000
    }
    if (pinyin?.startsWith(input)) {
      return 5000
    }
    if (pinyin?.includes(input)) {
      return 1000 + pinyin.length
    }
    return 0
  }

  /**
   * Extract the pinyin from the comment of the candidate
   * @param {string} comment the comment of the candidate
   * @returns {string | undefined} the pinyin
   */
  extractPinyin(comment) {
    const match = comment.match(/〖(.+?)〗/) // cn2en 插件提供的带调拼音
    if (match) {
      return unaccent(match[1])
    }
    const match2 = comment.match(/［(.*?)］/) || [] // 白霜拼音提供的不带调拼音
    return match2[1]
  }
}
