// 置顶候选项
/*
《说明书》

符合左边的编码(preedit)时，按顺序置顶右边的候选项。只是提升已有候选项的顺序，没有自创编码的功能。
脚本对比的是去掉空格的 cand.preedit，配置里写空格可以生成额外的编码，参考示例。

cand.preedit 是经过 translator/preedit_format 转换后的编码
⚠️ 注意方案的 preedit_format 设定，如果 v 显示为 ü，那么左边也要写 ü
⚠️ 双拼：显示为全拼拼写就要写全拼，如 'shuang pin'，显示为双拼拼写就要写双拼，如 'ul pb'

格式：编码<Tab>字词1<Space>字词2……
按照 YAML 语法，加不加引号都行，也可以这么写 pin_cand_filter: [l	了, 'de	的', 'ni hao	你好']

示例：
- 'le	了'       # 输入 le 时，置顶「了」
- 'ta	他 她 它'  # 可以置顶多个字，按顺序排列
- 'l	了 啦'    # 支持单编码，输入 l 时，置顶「了、啦」
- 'l	了 > 啦'  # 右边的字词如果包含空格，用 > 分割也行（大于号左右必须有空格）
- 'ta	啊'     # ❌ 编码不会产生的字词，不会生效且影响查找效率。自创编码的字词句可以写到 custom_phrase 中。
- 'hao	好 👌'  # ❌ 不要写 emoji

### 简拼
支持简拼，简拼加不加空格都行。但需要方案开启简拼，雾凇全拼是默认开启的，双拼默认没开启
- s m	什么
- wsm	为什么

### 空格的作用：
无空格，生成原样；
生成 nihao，输入 nihao 时首位是「你好」，但输入 nih 时首位可能是「你会 你还」等其他词语。
- nihao	你好
包含空格，额外生成最后一个空格后的拼音的首字母简码；
生成 nihao nih ，现在输入 nih 时首位也会是「你好」。
- ni hao	你好
包含空格且结尾以 zh ch sh 开头，再额外生成最后一个空格后的拼音的 zh ch sh 简码；
生成 buhaochi buhaoc buhaoch
- bu hao chi	不好吃

### 优先级：
以下两行，会额外生成 'da z' 'da zh' 的置顶，前两个候选项是「大专、大众」，先写的排在前面
- da zhuang	大专
- da zhong	大众
如果明确定义了简码形式，则完全使用简码形式
此时输入 daz 首位为「打字」，输入 dazh 首位仍为「大专、大众」
- da z	打字

* -------------------------------------------------------
* 使用 JavaScript 实现，适配 librime-qjs 插件系统。
* by @[HuangJian](https://github.com/HuangJian)
*/

/** @type {Map<string, Array<string>>} Mapping of input codes to pinned candidates */
const pinMap = new Map()

/**
 * Initialize the filter with configuration
 * @param {Environment} env - The Rime environment
 */
export function init(env) {
  console.log('pin_cand_filter init')
  const namespace = env.namespace.replace(/^\*/, '')

  if (pinMap.entries.length > 0) return // 已经初始化过了

  const list = env.engine.schema.config.getList(namespace)
  if (!list || list.getSize() === 0) return

  // 如果定义了 'da zhuan' 或 'da zhong' ，会自动生成 'daz' 和 'dazh' 的键。
  // 然而，如果明确定义了 'da z' 或 'da zh'，则会优先使用这些明确自定义的简码，用 set 来做判断。
  const set = new Set()
  for (let i = 0; i < list.getSize(); i++) {
    const item = list.getValueAt(i).getString()
    const [_, preedit, texts] = item.match(/^(.+?)\t(.+)$/) || []
    if (preedit?.length > 0 && texts?.length > 0) {
      set.add(preedit.replaceAll(' ', ''))
    }
  }

  // 遍历要置顶的候选项列表，将其转换为 table 存储到 env.pin_cands
  // 'l	了 啦' → env.pin_cands["l"] = {"了", "啦"}
  // 'ta	他 她 它' → env.pin_cands["ta"] = {"他", "她", "它"}
  //
  // 无空格的键，如 `nihao	你好` → env.pin_cands["nihao"] = {"你好"}
  //
  // 包含空格的的键，同时生成简码的拼写（最后一个空格后的首字母），如：
  // 'ni hao	你好 拟好' → env.pin_cands["nihao"] = {"你好", "拟好"}
  //                   → env.pin_cands["nih"] = {"你好", "拟好"}
  //
  // 如果最后一个空格后以 zh ch sh 开头，额外再生成 zh, ch, sh 的拼写，如：
  // 'zhi chi	支持' → env.pin_cands["zhichi"] = {"支持"}
  //               → env.pin_cands["zhic"] = {"支持"}
  //               → env.pin_cands["zhich"] = {"支持"}
  //
  // 如果同时定义了 'da zhuan	大专' 'da zhong	大众'，会生成：
  // env.pin_cands["dazhuan"] = {"大专"}
  // env.pin_cands["dazhong"] = {"大众"}
  // env.pin_cands["daz"] = {"大专", "大众"}  -- 先写的排在前面
  // env.pin_cands["dazh"] = {"大专", "大众"} -- 先写的排在前面
  //
  // 如果同时定义了 'da zhuan	大专' 'da zhong	大众' 且明确定义了简码形式 'da z	打字'，会生成：
  // env.pin_cands["dazhuan"] = {"大专"}
  // env.pin_cands["dazhong"] = {"大众"}
  // env.pin_cands["daz"] = {"打字"}          -- 明确定义的优先级更高
  // env.pin_cands["dazh"] = {"大专", "大众"}  -- 没明确定义的，仍然按上面的方式，先写的排在前面
  for (let i = 0; i < list.getSize(); i++) {
    const item = list.getValueAt(i).getString()
    let [_, preedit, texts] = item.match(/^(.+?)\t(.+)$/) || []
    if (preedit?.length > 0 && texts?.length > 0) {
      const words = texts.includes(' > ') ? texts.split(' > ') : texts.split(' ')

      // 按照键生成完整的拼写
      const preeditNoSpaces = preedit.replace(/ /g, '')
      pinMap.set(preeditNoSpaces, words)

      // 额外处理包含空格的 preedit，增加最后一个拼音的首字母和 zh, ch, sh 的简码
      if (preedit.includes(' ')) {
        const [_, precedingPart, lastPart] = preedit.match(/^(.+)\s(\S+)$/)

        // p1 生成最后一个拼音的首字母简码拼写（最后一个空格后的首字母），如 ni hao 生成 nih
        const p1 = precedingPart.replace(/ /g, '') + lastPart.charAt(0)
        // p2 生成最后一个拼音的 zh, ch, sh 的简码拼写（最后一个空格后以 zh ch sh 开头），如 zhi chi 生成 zhich
        let p2 = ''
        if (/^[zcs]h/.test(lastPart)) {
          p2 = precedingPart.replace(/ /g, '') + lastPart.substring(0, 2)
        }
        ;[p1, p2].forEach((p) => {
          // 只在没有明确定义此简码时才生成，已有的追加，没有的直接赋值
          if (p !== '' && !set.has(p)) {
            if (pinMap.has(p)) {
              words.forEach((text) => {
                pinMap.get(p).push(text)
              })
            } else {
              pinMap.set(p, pinMap[preeditNoSpaces])
            }
          }
        })
      }
    }
  }
}

/**
 * Filter candidates to pin the matched ones to the top
 * @param {Array<Candidate>} candidates - Array of candidates to re-order
 * @param {Environment} env - The Rime environment
 * @returns {Array<Candidate>} The re-ordered candidates
 */
export function filter(candidates, env) {
  // 当前输入框的 preedit，未经过方案 translator/preedit_format 转换
  // 输入 nihaoshij 则为 nihaoshij，选择了「你好」后变成 你好shij

  // env.engine.context.preedit.text 只有长度，不是英文字符
  // 改用 env.engine.context.input 更稳定
  const fullPreedit = env.engine.context.input // 输入码
  const letterOnlyPreedit = fullPreedit.replace(/[^a-zA-Z]/g, '')
  // 非汉字部分的 preedit，如 shij
  if (pinMap.size === 0 || letterOnlyPreedit.length === 0) {
    return candidates
  }

  /*
        full_preedit 与候选项的情况
            hao        好、号、毫 ... 哈、蛤、铪
            你hao      好、号、毫 ... 哈、蛤、铪
            haobu      好不、毫不 ... 好、号、毫 ... 哈、蛤、铪
            你haobu    好不、毫不 ... 好、号、毫 ... 哈、蛤、铪
        简化为 letter_only_preedit 与候选项的情况
            hao        好、号、毫 ... 哈、蛤、铪
            haobu      好不、毫不 ... 好、号、毫 ... 哈、蛤、铪

        在循环中随着候选项的变化，cand.preedit 也跟着变化：
        ｜ letter_only_preedit ｜        cand.preedit         ｜
        ｜---------------------｜-----------------------------｜
        ｜         dian        ｜    dian ... di              ｜
        ｜         ha          ｜    ha                       ｜
        ｜         hao         ｜    hao ... ha               ｜
        ｜         haobu       ｜    hao bu ... hao ... ha    ｜
    */

  // 用 pined 和 others 调整顺序，找齐后先遍历 pined 再遍历 others
  const yields = [] // 直接 yield 的候选项
  const pinedHolder = [] // 提升的候选项: Array<{text:string, candidate:Candidate}>
  const others = [] // 其余候选项
  let pinedSize = 0
  let i = 0
  for (; i < candidates.length; i++) {
    const candidate = candidates[i]
    const preedit = candidate.preedit.replaceAll(' ', '') // 对比去掉空格的 cand.preedit
    const matchingWords = pinMap.get(preedit)

    if (!matchingWords) {
      // 当前候选项无须排序，直接 yield 并结束循环
      // 当前候选项正在排序，例如要置顶某个 `hao`，但从 `hao` 查到 `ha` 了还没找齐，不能直接 yield，要先输出 pined 和 others 中的 `hao`
      if (letterOnlyPreedit === preedit) {
        yields.push(candidate)
      } else {
        others.push(candidate)
      }
      break
    }

    addPlaceHoldersToPinedHolder(pinedHolder, matchingWords)

    const itemToPin = pinedHolder.find((it) => it.text === candidate.text) // 找到对应的候选项
    // 要置顶的放到 pined 中，其余的放到 others
    if (itemToPin) {
      pinedSize++
      itemToPin.candidate = candidate
      candidate.comment = '📌' + candidate.comment
    } else {
      others.push(candidate)
    }
    // 找齐了或查询超过 100 个就不找了（如果要提升的候选项不在前 100 则不会被提升）
    if (pinedSize === matchingWords.length || others.length > 100) {
      break
    }
  }

  const pinedCandidates = pinedHolder.map((it) => it.candidate).filter((it) => it)
  // yield pined others 及后续的候选项
  return [...yields, ...pinedCandidates, ...others, ...candidates.slice(i)]
}

/**
 * 给 pined 几个占位元素，后面直接置换为实际的candidate， 确保 pined 与 words 顺序一致
 * @param {Array<{text:string, candidate:Candidate}>} pinedHolder
 * @param {Array<string>} words
 */
function addPlaceHoldersToPinedHolder(pinedHolder, words) {
  words
    .filter((word) => !pinedHolder.some((it) => it.text === word))
    .forEach((word) => {
      pinedHolder.push({
        text: word,
        candidate: null,
      })
    })
}
