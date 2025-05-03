function isPureEnglish(word) {
  return /^[a-z'\- ]+$/.test(word)
}

function formatInfo(info) {
  return info.replace(/\\n/g, '\n\t\t')
}

/**
 * 英译汉过滤器
 * @implements {FastFilter}
 */
export class En2CnFilter {
  /**
   * LevelDb对象，用于存储和查询英文单词的中文释义
   * @type {LevelDb}
   */
  levelDb = null
  /**
   * 初始化插件
   * @param {Environment} env - 环境对象，包含用户数据目录、文件操作等功能
   * @description 加载字典数据，优先从二进制文件加载以提高性能，如果二进制文件不存在则从文本文件加载并生成二进制文件
   */
  constructor(env) {
    console.log('en2cn filter init')

    // @ts-expect-error for unit test
    this.levelDb = env.levelDb || new LevelDb()
    // @ts-expect-error for unit test
    const txtPath = env.en2cnTextFilePath || `${env.userDataDir}/lua/data/ecdict.txt`
    // @ts-expect-error for unit test
    const binPath = env.en2cnBinaryFilePath || `${env.userDataDir}/js/data/en2cn.ldb`

    let tick = Date.now()
    if (env.fileExists(binPath)) {
      this.levelDb.loadBinaryFile(binPath)
      console.log(`en2cn filter: load dict from bin file takes: ${Date.now() - tick}ms`)
    } else {
      this.levelDb.loadTextFile(txtPath, { lines: 60000 })
      this.levelDb.saveToBinaryFile(binPath) // leveldb 必须要保存成二进制文件，否则无法使用查找功能
      console.log(`en2cn filter: load dict from text to bin takes: ${Date.now() - tick}ms`)
    }
  }

  /**
   * 插件终止函数
   * @description 在输入法退出或重新部署时调用，用于清理资源
   */
  finalizer() {
    console.log('en2cn filter finit')
    this.levelDb?.close()
  }

  /**
   * Check if the filter is applicable in the current context
   * @param {Environment} env - The Rime environment
   * @returns {boolean} True if the filter is applicable, otherwise false
   */
  isApplicable(env) {
    return env.engine.context.input.length > 1
  }

  /**
   * 候选项过滤器主函数
   * @param {CandidateIterator} iter - 候选项迭代器，用于遍历候选项
   * @param {Environment} env - 环境对象，包含引擎上下文等信息
   * @returns {Generator<Candidate, CandidateIterator | void>} 过滤后的候选项迭代器
   * @description 为英文候选项添加中文释义，并处理中文翻译的快捷选择功能
   */
  *filter(iter, env) {
    const existingWords = new Map()
    // 从候选项中找到最后一个英文单词的位置，将新查找到的单词插入到该位置之后
    // 只有中文没有英文候选项，那就插到第五个之后
    let lastEnglishCandidateIndex = 5

    const processed = [] // 最多处理前 120 个候选词，提高性能
    for (let idx = 0, candidate; idx < 120 && (candidate = iter.next()); idx++) {
      processed.push(candidate)
      const text = candidate.text.toLowerCase()
      if (!isPureEnglish(text)) {
        continue
      }

      existingWords.set(text, true)
      lastEnglishCandidateIndex = idx

      // 先为所有英文候选项加上中文释义
      const info = this.levelDb.find(text)
      if (info) {
        candidate.comment = formatInfo(info)
      }
    }

    // 再从英文词典中查找匹配该前缀的单词，添加到候选项中
    const prefix = env.engine.context.input.toLowerCase()
    // 2 个字符以下的前缀不做处理，避免刷屏
    if (prefix.length > 2 && isPureEnglish(prefix)) {
      // 将查找到的单词插入到候选项中
      this.levelDb.prefixSearch(prefix).forEach((it) => {
        if (existingWords.has(it.text)) return

        const candidate = new Candidate('en', 0, prefix.length, it.text, formatInfo(it.info))
        processed.splice(lastEnglishCandidateIndex, 0, candidate)
        lastEnglishCandidateIndex++
      })
    }
    yield* processed
    return iter
  }
}
