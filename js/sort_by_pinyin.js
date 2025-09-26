import { unaccent } from './lib/string.js'

/**
 * 根据候选项的拼音和输入字符的匹配程度，重新排序候选项。
 *  仅对带拼音的候选项进行就地重排，其它类型的候选项（长句子、emoji、英语单词等）保持原顺序。
 * @implements {FastFilter}
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
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    return env.engine.context.input.length > 1
  }

  /**
   * Sort the candidates by pinyin
   * @param {CandidateIterator} iter - The iterator of the candidates to sort
   * @param {Environment} env - The Rime environment
   * @returns {Generator<Candidate, CandidateIterator | void>} The sorted candidates
   */
  *filter(iter, env) {
    const userPhrases = []
    const userPhrasesIndices = []
    const candidatesWithPinyin = []
    const candidatesWithPinyinIndices = []

    const input = env.engine.context.input.replace(/\/.*$/, '') // 去掉 /py /en 等快捷键
    const start = env.engine.context.lastSegment?.start ?? 0
    const end = env.engine.context.lastSegment?.end ?? input.length
    const segmentInput = env.engine.context.input.slice(start, end) // 仅当前选中分段的拼音输入："xuanzhong|fenduan" => "xuanzhong"

    const fetched = []
    // 只查找前面 topN 个候选词，提高性能
    for (let idx = 0, candidate; idx < this.#topN && (candidate = iter.next()); idx++) {
      fetched.push(candidate)
      const pinyin = this.extractPinyin(candidate.comment)?.replaceAll(' ', '')
      if (candidate.type === 'user_phrase') {
        const weight = this.getWeightByPinyin(pinyin, segmentInput, true) + this.#topN - idx
        userPhrasesIndices.push(idx)
        userPhrases.push({ candidate, weight })
      } else if (pinyin) {
        const weight = this.getWeightByPinyin(pinyin, segmentInput, false) + this.#topN - idx
        candidatesWithPinyinIndices.push(idx)
        candidatesWithPinyin.push({ candidate, weight })
      }
    }

    // 就地重排用户词典的候选词
    userPhrases.sort((a, b) => b.weight - a.weight)
    userPhrasesIndices.forEach((originalIndex, idx) => {
      fetched[originalIndex] = userPhrases[idx].candidate
    })

    // 就地重排其它带拼音的候选词
    candidatesWithPinyin.sort((a, b) => b.weight - a.weight)
    candidatesWithPinyinIndices.forEach((originalIndex, idx) => {
      fetched[originalIndex] = candidatesWithPinyin[idx].candidate
    })

    yield* fetched
    return iter
  }

  /**
   * 计算候选项的权重分数，用于智能排序。
   *
   * @param {string | undefined} pinyin - 候选项的不带调拼音，不包含空格
   * @param {string} input - 用户输入的编码，不包含 /py 等快捷键
   * @param {boolean} isInUserPhrase - 候选项是否在用户词典中
   * @returns {number} 权重分数，规则如下：
   *    - 拼音完全匹配：+10,000 + 拼音长度
   *    - 拼音前缀匹配：+5,000 + 拼音长度
   *    - 拼音部分包含：+1,000 + 拼音长度
   *    - 找不到拼音但在用户词典中：自造词，视为前缀匹配 +5,000
   *    - 其它情况：0
   */
  getWeightByPinyin(pinyin, input, isInUserPhrase) {
    if (pinyin === input) {
      return 10000 + pinyin.length
    }
    if (isInUserPhrase && !pinyin) {
      return 5000
    }
    if (pinyin?.startsWith(input)) {
      return 5000 + pinyin.length
    }
    // TODO: 部分包含不实用，应替换为 levenshtein 距离，用于处理模糊音/击键顺序错误/常用词只打声母等情况。
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
