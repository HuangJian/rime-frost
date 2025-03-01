/**
 * 中文输入法插件，提供以下功能：
 * 1. 为中文候选项添加拼音注解和英文释义
 * 2. 支持通过 /p 快捷键选择拼音（如 /py 选择第一个候选项的拼音，/pa 选择第二个候选项的拼音）
 * 3. 支持通过 /e 快捷键选择英文翻译（如 /en 选择第一个候选项的翻译，/ea 选择第二个候选项的翻译）
 * 4. 智能排序：根据拼音匹配度、用户词典、词语长度等因素对候选项进行排序
 *
 * -------------------------------------------------------
 * 使用 JavaScript 实现，适配 librime-qjs 插件系统。
 * by @[HuangJian](https://github.com/HuangJian)
 */

import { isChineseWord } from "./lib/string.js"
import { getCandidateWeight } from "./lib/weight.js"

/**
 * 设置查找拼音和英文释义的候选项数量上限
 * @type {number}
 * @description 为了避免性能问题，只查找前面指定数量的候选项
 */
const sizeToLookupEnglish = 200 // 只查找前面 200 项的拼音和英文释义

/**
 * 英文翻译选择的上标提示符号
 * @type {string}
 * @description 用于在候选项注释中显示的上标字符，提示用户可通过快捷键选择对应的英文翻译
 */
const enHintCodes = 'ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'

/**
 * 英文翻译选择的快捷键
 * @type {string}
 * @description 与 enHintCodes 一一对应的快捷键，用于选择对应的英文翻译
 */
const enHintKeys = 'nabcdefghijklmoprstuvwxyz'

/**
 * 拼音选择的上标提示符号
 * @type {string}
 * @description 用于在候选项注释中显示的上标字符，提示用户可通过快捷键选择对应的拼音
 */
const pyHintCodes = 'ʸᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣᶻ'

/**
 * 拼音选择的快捷键
 * @type {string}
 * @description 与 pyHintCodes 一一对应的快捷键，用于选择对应的拼音
 */
const pyHintKeys = 'yabcdefghijklmnoprstuvwxz'

/**
 * 字典树对象，用于存储和查询中文词汇的拼音和英文释义
 * @type {Trie}
 */
let trie

/**
 * 初始化插件
 * @param {Object} env - 环境对象，包含用户数据目录、文件操作等功能
 * @description 加载字典数据，优先从二进制文件加载以提高性能，如果二进制文件不存在则从文本文件加载并生成二进制文件
 */
export function init(env) {
  console.log('cn2en_pinyin filter init')

  trie = env.trie || new Trie()

  const txtPath =
    env.cn2enTextFilePath || // for unit test
    `${env.userDataDir}/../js/data/cedict_fixed.u8`
  const binPath =
    env.en2cnBinaryFilePath || // for unit test
    `${env.userDataDir}/../js/data/cedict.bin`

  let tick = Date.now()
  if (env.fileExists(binPath)) {
    trie.loadBinaryFile(binPath)
    console.log(`cn2en_pinyin filter: load dict from binary file takes: ${Date.now() - tick}ms`)
  } else {
    trie.loadTextFile(txtPath, 119000)
    console.log(`cn2en_pinyin filter: load dict from text file takes: ${Date.now() - tick}ms`)

    trie.saveToBinaryFile(binPath)
    console.log('cn2en_pinyin filter: saved dict to a binary file for future use')
  }
}

/**
 * 插件终止函数
 * @param {Object} env - 环境对象
 * @description 在输入法退出或重新部署时调用，用于清理资源
 */
export function finit(env) {
  console.log('cn2en_pinyin filter finit')
}

/**
 * 候选项过滤器主函数
 * @param {Array} candidates - 候选项数组
 * @param {Object} env - 环境对象，包含引擎上下文等信息
 * @returns {Array} 处理后的候选项数组
 * @description 为中文候选项添加拼音注解和英文释义，并处理拼音和英文翻译的快捷选择功能
 */
export function filter(candidates, env) {
  const input = env.engine.context.input
  // Remove everything after a slash (e.g. "zhangk/e" becomes "zhangk")
  const inputCode = input.replace(/\/.*/, '')

  const ret = []
  let sizeInserted = 0
  candidates.forEach((candidate, idx) => {
    if (
      idx >= sizeToLookupEnglish || // 只查找前面 sizeToLookupPinyin 个候选词，避免性能问题
      candidate.text.length > 10 || // 超过10个字的词不查找
      !isChineseWord(candidate.text) || // not a Chinese word
      candidate.comment.includes('〖') || // 已经查过了
      false
    ) {
      ret.push(candidate)
      return
    }

    const info = trie.find(candidate.text)
    if (!info) {
      ret.push(candidate)
      return
    }

    const candidatesHavingTheSameText = extractCandidatesByInfo(candidate, info, input)
    sizeInserted += candidatesHavingTheSameText.length - 1
    ret.push(...candidatesHavingTheSameText)
  })

  // TODO: 启用模糊音后出现很多与全拼输入不匹配的词语，需要排除它们的干扰。
  // FIXME: 尝试根据拼音的相似度来排序，但是很不稳定，而且对英文及 emoji 等特殊字符的支持不好。暂时不启用。
  // sortTopNCandidatesByPinyin(ret, sizeToLookupEnglish + sizeInserted, inputCode)
  // ret.filter((it) => it.weight).forEach((it) => (it.comment = it.comment + '🔨' + it.weight))

  hintToPickEnglish(ret, input)
  tryPrependOrCommitEnglish(ret, input, env.engine)

  hintToPickPinyin(ret, input)
  tryPrependOrCommitPinyin(ret, input, env.engine)

  return ret
}

/**
 * 根据词典信息提取候选项
 * @param {Object} candidate - 原始候选项对象
 * @param {string} info - 从字典中查询到的信息，包含拼音和英文释义
 * @param {string} inputCode - 用户输入的编码
 * @returns {Array} 处理后的候选项数组
 * @description 解析字典中的拼音和英文释义信息，为候选项添加注解。如果一个词有多个拼音或释义，会创建多个候选项
 */
function extractCandidatesByInfo(candidate, info, inputCode) {
  // 去掉雾凇拼音方案设置在注解中的拼音，但保留其它插件的注解，如 pin_cand_filter 的 📌，is_in_user_dict 的 ∞/*
  const prevComment = candidate.comment?.replace(/(［.+)］/g, '')

  // format: [diǎn diǎn]Diandian (Chinese microblogging and social networking website)||[diǎn diǎn]point/speck
  const ret = info
    .split('||')
    .map((item, idx) => {
      const [_, pinyin, en] = /^\[(.*?)\](.*)$/.exec(item) || []
      if (!pinyin) return null

      const comment = prevComment + '〖' + pinyin + '〗' + en
      let theCandidate = candidate
      if (idx > 0) {
        theCandidate = new Candidate('cn', 0, inputCode.length, candidate.text, comment)
      } else {
        theCandidate.comment = comment
      }
      theCandidate.pinyin = pinyin
      theCandidate.en = en

      return theCandidate
    })
    .filter((it) => it)
  return ret.length > 0 ? ret : [candidate]
}

/**
 * 根据拼音对候选项进行排序
 * @param {Array} candidates - 候选项数组
 * @param {number} topN - 需要排序的候选项数量
 * @param {string} inputCode - 用户输入的编码
 * @description 根据拼音匹配度、用户词典、词语长度等因素对前N个候选项进行排序
 */
function sortTopNCandidatesByPinyin(candidates, topN, inputCode) {
  const size = candidates.length > topN ? topN : candidates.length
  const topCandidates = candidates.slice(0, size)

  topCandidates.forEach((item, idx) => (item.weight = getCandidateWeight(item, inputCode) + size - idx))
  topCandidates.sort((a, b) => b.weight - a.weight)

  candidates.splice(0, size)
  candidates.unshift(...topCandidates)
}

/**
 * 为候选项添加英文翻译选择的提示标记
 * @param {Array} candidates - 候选项数组
 * @param {string} input - 用户输入的原始字符串
 * @description 当用户输入以 /e 结尾时，为含有英文翻译的候选项添加上标提示符号，便于用户通过快捷键选择
 */
function hintToPickEnglish(candidates, input) {
  if (input.length < 3 ||! /\/e.?$/.test(input)) return

  // '/e' 启用汉译英上屏，注释上提示汉译英候选项的辅助码 => '/en', '/ea', '/eb', ...
  let idxHint = 0
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    if (item.en && idxHint < enHintKeys.length) {
      item.comment = '⇖' + enHintCodes[idxHint] + item.comment
      if (idxHint++ >= enHintKeys.length) break
    }
  }
}

/**
 * 处理英文翻译的选择和上屏
 * @param {Array} candidates - 候选项数组
 * @param {string} input - 用户输入的原始字符串
 * @param {Object} engine - 输入法引擎对象
 * @description 当用户输入以 /en、/ea 等快捷键结尾时，选择对应的英文翻译并上屏或添加到候选项列表
 */
function tryPrependOrCommitEnglish(candidates, input, engine) {
  const inputSize = input.length
  if (input.substring(inputSize - 3, inputSize - 1) !== '/e') return

  const lastChar = input.substring(inputSize - 1, inputSize)
  const idx = enHintKeys.indexOf(lastChar) // '/en' => 1st, '/ea' => 2nd, '/eb' => 3rd, ...
  if (idx < 0) return

  const hintCode = '⇖' + enHintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return

  const rightBracketPos = pickingItem.comment.indexOf('〗')
  const arr = pickingItem.comment
    .substring(rightBracketPos + 1)
    .split('/')
    .filter((it) => !it.includes('CL')) // CL 表示量词，不候选

  if (arr.length === 1) {
    // 唯一翻译，直接上屏
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    // 多种翻译，插入候选
    candidates.unshift(pickingItem) // 把对应的汉语候选项移到最上面
    const text = pickingItem.text
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('en', 0, inputSize + 2, it, '翻译自：' + text))
    })
  }
}

/**
 * 为候选项添加拼音选择的提示标记
 * @param {Array} candidates - 候选项数组
 * @param {string} input - 用户输入的原始字符串
 * @description 当用户输入以 /p 结尾时，为含有拼音的候选项添加上标提示符号，便于用户通过快捷键选择
 */
function hintToPickPinyin(candidates, input) {
  if (input.length < 3 || !/\/p.?$/.test(input)) return

  // '/p' enables pinyin selection with hint codes => '/py', '/pa', '/pb', ...
  let idxHint = 0
  for (let i = 0; i < candidates.length; i++) {
    const item = candidates[i]
    if (item.pinyin && idxHint < pyHintKeys.length) {
      item.comment = '⇖' + pyHintCodes[idxHint] + item.comment
      if (idxHint++ >= pyHintKeys.length) break
    }
  }
}

/**
 * 处理拼音的选择和上屏
 * @param {Array} candidates - 候选项数组
 * @param {string} input - 用户输入的原始字符串
 * @param {Object} engine - 输入法引擎对象
 * @description 当用户输入以 /py、/pa 等快捷键结尾时，选择对应的拼音并上屏或添加到候选项列表
 */
function tryPrependOrCommitPinyin(candidates, input, engine) {
  const inputSize = input.length
  if (input.substring(inputSize - 3, inputSize - 1) !== '/p') return

  const lastChar = input.substring(inputSize - 1, inputSize)
  const idx = pyHintKeys.indexOf(lastChar) // '/py' => 1st, '/pa' => 2nd, '/pb' => 3rd, ...
  if (idx < 0) return

  const hintCode = '⇖' + pyHintCodes[idx]
  const pickingItem = candidates.find((it) => it.comment?.startsWith(hintCode))
  if (!pickingItem) return

  const arr = pickingItem.pinyin.split(' ')
  if (arr.length === 1) {
    // Single pinyin, commit directly
    engine.commitText(arr[0])
    engine.context.clear()
  } else {
    // Multiple pinyin syllables, insert as candidates
    candidates.unshift(pickingItem) // Move the corresponding Chinese candidate to the top
    arr.reverse().forEach((it) => {
      candidates.unshift(new Candidate('py', 0, inputSize + 2, it, '拼音：' + pickingItem.text))
    })
    candidates.unshift(new Candidate('py', 0, inputSize + 2, pickingItem.pinyin, '拼音：' + pickingItem.text))
  }
}
