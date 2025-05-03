/**
 * 辅助码反查过滤器：使用其他方案提供的编码反查候选。
 *
 * 此过滤器允许用户在输入过程中使用反引号（`）作为引导符，输入辅助码来快速定位候选字。
 * 例如：输入 "jiazheshenxi`jin" 可以使用 "jin" 作为辅助码来筛选候选项。
 * 功能描述文档：https://github.com/mirtlecn/rime-radical-pinyin/blob/master/search.lua.md
 *
 * @implements {FastFilter} 实现了 Rime 的 FastFilter 接口
 * @author https://github.com/HuangJian
 *
 * @example
 * // 使用示例：
 * // 1. 输入主码：jiazheshenxi
 * // 2. 输入引导符：`
 * // 3. 输入辅助码：jin
 * // 系统将优先显示辅助码匹配的候选项
 */
export class SearchFilter {
  /**
   * 使用 LevelDb 存储辅助码到汉字的映射
   * @type {LevelDb}
   */
  dict = null
  /**
   * 存储所有活跃的选词监听器
   * @type {Array<{envId: string, connection: NotifierConnection}>}
   */
  selectListeners = []
  /**
   * 初始化过滤器
   * @param {Environment} env - Rime环境对象，提供了访问用户数据目录等功能
   */
  constructor(env) {
    console.log('search.filter.js init')

    // @ts-expect-error for unit test
    this.dict = env.levelDb || new LevelDb()
    // @ts-expect-error for unit test
    const txtPath = env.en2cnTextFilePath || `${env.userDataDir}/radical_pinyin.dict.yaml`
    // @ts-expect-error for unit test
    const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/radical.ldb`

    let tick = Date.now()
    if (env.fileExists(binPath)) {
      this.dict.loadBinaryFile(binPath)
      console.log(`search filter: load radical dict from bin file takes: ${Date.now() - tick}ms`)
    } else {
      // `𬭸\tjin'mi'xi'kuang'shu` => key = 'jinmixikuangshu', value = '𬭸'
      this.dict.loadTextFile(txtPath, {
        lines: 40300,
        isReversed: true,
        charsToRemove: "'\r",
        onDuplicatedKey: 'Concat',
        concatSeparator: '|',
      })
      this.dict.saveToBinaryFile(binPath)
      console.log(`search filter: load radical dict from text file to levelDb takes: ${Date.now() - tick}ms`)
    }
  }

  /**
   * 清理过滤器资源
   */
  finalizer() {
    console.log('search.filter.js finit')
    this.selectListeners.forEach((it) => it.connection.disconnect())
    this.selectListeners = []
    this.dict?.close()
  }

  /**
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    const input = env.engine.context.input
    const pos = input.indexOf(CONDUCTOR_CODE)
    return input.length > 2 && pos > 1 && pos < input.length - 1
  }

  /**
   * 根据辅助码对候选项进行排序
   * @param {CandidateIterator} iter - 候选项迭代器，用于遍历候选项
   * @param {Environment} env - Rime环境对象
   * @returns {Generator<Candidate, CandidateIterator | void>} 处理后的候选项，以辅助码匹配的顺序排列
   */
  *filter(iter, env) {
    const input = env.engine.context.input
    const pos = input.indexOf(CONDUCTOR_CODE)
    if (pos < 1 || pos === input.length - 1) return iter

    // 因为插件永驻机制，切换输入法会话不会执行 finalizer 方法。
    // 于是需要在这里清理断开的监听器，并确保当前上下文有监听器。
    // 有引导符时，每次输入编码都执行下面代码，可能产生一些性能损耗，不过体感不明显。
    this.clearDisconnectedListeners()
    this.connectListenerToRimeContextIfNotYet(env.engine.context, env.id)

    // 提取辅助码并在字典中查找匹配的字符
    const key = input.substring(pos + 1)
    const entries = (this.dict.prefixSearch(key) || []).map((it) => it.info)

    if (entries.length === 0) return iter

    // console.log(`auxiliary code: ${key}, matchesSize = ${entries.length} ================`)
    // for (let i = 0; i < Math.min(10, entries.length); ++i) {
    //   console.log(`search filter: matched[${i}] = `, entries[i])
    // }

    // 将匹配的候选项移到前面
    const matchedCandidates = []
    const others = []
    // 只查找前面 500 个候选词，提高性能
    for (let idx = 0, candidate; idx < 500 && (candidate = iter.next()); idx++) {
      if (entries.includes(candidate.text)) {
        matchedCandidates.push(candidate)
      } else {
        others.push(candidate)
      }
    }

    yield* matchedCandidates
    yield* others
    return iter
  }
  /**
   * 为Rime上下文添加选词事件监听器
   * @param {Context} context - Rime输入法上下文
   * @param {string} envId - 环境ID，用于标识不同的输入环境
   */
  connectListenerToRimeContextIfNotYet(context, envId) {
    if (!this.selectListeners.some((it) => it.envId === envId)) {
      console.log('connecting listener to rime context', envId)
      const connection = context.selectNotifier.connect(onRimeSelectCallback)
      this.selectListeners.push({ envId, connection })
    }
  }

  /**
   * 清理已断开连接的监听器
   * 遍历监听器数组，移除并清理那些已经断开连接的监听器
   */
  clearDisconnectedListeners() {
    for (let i = this.selectListeners.length - 1; i >= 0; --i) {
      if (!this.selectListeners[i].connection.isConnected) {
        this.selectListeners[i].connection.disconnect()
        this.selectListeners.splice(i, 1)
      }
    }
  }
}

// 辅助码的引导符
const CONDUCTOR_CODE = '`'

/**
 * 处理选词事件的回调函数
 * 根据输入的类型决定是保留引导符还是直接上屏：
 * 1. 如果还有未选择的编码，保留引导符以便继续输入辅助码
 * 2. 如果所有编码都已选择完毕，则直接上屏
 *
 * @param {Context} context - Rime输入法上下文
 * @example
 * // 示例输入：jiazheshenxi`jin
 * // preedit文本：镓zheshenxi`jin
 * // 未选择的编码：zheshenxi
 * // 此时保留引导符，等待用户继续输入辅助码
 */
function onRimeSelectCallback(context) {
  const input = context.input // jiazheshenxi`jin
  const pos = input.indexOf(CONDUCTOR_CODE)
  if (pos < 1) return

  const inputCode = input.substring(0, pos) // jiazheshenxi
  const preedit = context.preedit.text // 镓zheshenxi`jin
  // 过滤掉已经选择的汉字，只保留未选择的拼音编码
  let unselectedCode = preedit.replace(/[\u4e00-\u9fff]/g, '') // zheshenxi`jin
  unselectedCode = unselectedCode.substring(0, unselectedCode.indexOf(CONDUCTOR_CODE)) // zheshenxi

  if (unselectedCode.length > 0) {
    // 还有未选择的编码，保留引导符，等待用户继续输入辅助码进行下一个选词
    context.input = inputCode + CONDUCTOR_CODE
  } else {
    // 所有编码都已选择，直接上屏
    context.input = inputCode
    context.commit()
  }
}
