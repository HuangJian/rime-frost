import { Trie } from './lib/trie.js'

/**
 * 辅助码反查过滤器：使用其他方案提供的编码反查候选。
 *
 * 此过滤器允许用户在输入过程中使用反引号（`）作为引导符，输入辅助码来快速定位候选字。
 * 例如：输入 "jiazheshenxi`jin" 可以使用 "jin" 作为辅助码来筛选候选项。
 * 功能描述文档：https://github.com/mirtlecn/rime-radical-pinyin/blob/master/search.lua.md
 *
 * @implements {Filter} 实现了Rime的Filter接口
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
  // 使用字典树存储辅助码到汉字的映射
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
    this.dict = new Trie(true)
    const dictYamlPath = `${env.userDataDir}/radical_pinyin.dict.yaml`
    let entries = 0
    env
      .loadFile(dictYamlPath)
      .split('\n')
      .filter((it) => !it.startsWith('#'))
      .forEach((line) => {
        const pos = line.indexOf('\t')
        if (pos > 0) {
          // 字典文件格式：汉字<tab>编码，例如：𬭸<tab>jin'mi'xi'kuang'shu
          const char = line.substring(0, pos)
          const code = line.substring(pos + 1).replaceAll("'", '')
          this.dict.insert(code, char)
          ++entries
        }
      })
    console.log(`loaded ${dictYamlPath} with ${entries} entries`)
  }

  /**
   * 清理过滤器资源
   */
  finalizer() {
    console.log('search.filter.js finit')
    this.selectListeners.forEach(it => it.connection.disconnect())
    this.selectListeners = []
  }

  /**
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    const input = env.engine.context.input
    return input.length > 2 && input.includes(CONDUCTOR_CODE)
  }

  /**
   * 根据辅助码对候选项进行排序
   * @param {Array<Candidate>} candidates - 候选项数组
   * @param {Environment} env - Rime环境对象
   * @returns {Array<Candidate>} 排序后的候选项数组，匹配的候选项会被移到前面
   */
  filter(candidates, env) {
    const input = env.engine.context.input
    const pos = input.indexOf(CONDUCTOR_CODE)
    if (pos < 1) return candidates

    // 因为插件永驻机制，切换输入法会话不会执行 finalizer 方法。
    // 于是需要在这里清理断开的监听器，并确保当前上下文有监听器。
    // 有引导符时，每次输入编码都执行下面代码，可能产生一些性能损耗，不过体感不明显。
    this.clearDisconnectedListeners()
    this.connectListenerToRimeContextIfNotYet(env.engine.context, env.id)

    // 提取辅助码并在字典中查找匹配的字符
    const key = input.substring(pos + 1)
    const entries = (this.dict.prefixSearch(key) || []).flatMap((it) => it.info)

    // 将匹配的候选项移到前面
    const matchedCandidates = []
    const others = []
    candidates.forEach((candidate) => {
      if (entries.includes(candidate.text)) {
        matchedCandidates.push(candidate)
      } else {
        others.push(candidate)
      }
    })
    return matchedCandidates.concat(others)
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
