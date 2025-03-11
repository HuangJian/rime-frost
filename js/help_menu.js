// 帮助菜单，/help 触发显示
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

/** @type {Array<[string, string]>} */
const menus = [
  ['帮助菜单', '→ /help'],
  ['快捷指令', '→ /deploy /screenshot'],
  ['方案选单', '→ F4'],
  ['快速计算', '→ /calc 或 /js 组合键，如`/calcsin(pi/2)`候选`1.0`'],
  ['拆字反查', '→ uU 组合键，如`uUguili`反查出`魑〘chī〙`'],
  ['汉译英上屏', '→ /e* 组合键，如`shuxue/en`上屏`mathematics`'],
  ['拼音上屏', '→ /p* 组合键，如`pinyin/py1`上屏`pīn yīn`'],
  ['二三候选', "→ ;'号键"],
  ['上下翻页', '→ ,.号键'],
  ['以词定字', '→ []号键'],
  ['单词大写', '→ AZ 大写字母触发'],
  ['日期时间', '→ rq | sj | xq | dt | ts | nl'],
  ['中文数字', '→ R快捷键，如`R666`候选`六百六十六元整`'],
]

/**
 * 帮助菜单翻译器
 * @implements {Translator}
 */
export class HelpMenuTranslator {
  /**
   * Initialize the help menu translator
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('help_menu.js init')
  }

  /**
   * Clean up the help menu translator
   * @param {Environment} env - The Rime environment
   */
  finalizer(env) {
    console.log('help_menu.js finit')
  }

  /**
   * Translate help menu related input
   * @param {string} input - The input string to translate
   * @param {Segment} segment - The input segment
   * @param {Environment} env - The Rime environment
   * @returns {Array<Candidate>} Array of translation candidates
   */
  translate(input, segment, env) {
    if (input.length < 3 || !'/help'.startsWith(input)) return []

    segment.prompt = '〔帮助菜单〕'

    const ret = menus.map(
      ([text, comment]) => new Candidate('help', segment.start, segment.end, text, comment),
    )
    ret.unshift(new Candidate('help', segment.start, segment.end, '版本状态', env.getRimeInfo()))
    return ret
  }
}
