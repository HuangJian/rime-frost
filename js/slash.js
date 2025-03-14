// 连续按斜杠键（/）时，在候选符号中切换。
// 用以绕过 / 触发表情符号，无法用数字键选中候选项的问题。
//    用例：输入 "/" 字符，候选：/、//、／、÷；
//         这时候如果接着输入数字 4，会触发 "/4" 的候选：四、4️⃣、肆、⁴、₄、……，而不是上屏÷；
//         使用本插件，可以连续按下四次斜杠键，选中到 ÷，然后按下空格键使其上屏。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { KeyRepr } from './lib/rime.js'

/**
 * 配对符号自动补全
 * @implements {Processor}
 */
export class SlashProcessor {
  direction = KeyRepr.Down
  /**
   * Initialize the processor
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('slash.js init')
  }

  /**
   * Clean up when processor is unloaded
   */
  finalizer() {
    console.log('slash.js finit')
  }

  /**
   * Process key events to switch between candidates
   * @param {KeyEvent} keyEvent - The key event to process
   * @param {Environment} env - The Rime environment
   * @returns {ProcessResult} Result indicating if key was handled
   */
  process(keyEvent, env) {
    const context = env.engine.context
    if (context.hasMenu()) {
      const segment = context.lastSegment
      if (keyEvent.repr === KeyRepr.slash && segment?.getCandidateAt(0)?.text === '/') {
        if (segment.selectedIndex >= segment.candidateSize - 1) {
          this.direction = KeyRepr.Up
        } else if (segment.selectedIndex === 0) {
          this.direction = KeyRepr.Down
        }
        env.engine.processKey(this.direction)
        return 'kAccepted'
      }
    }

    return 'kNoop'
  }
}
