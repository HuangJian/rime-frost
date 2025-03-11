// 自动补全配对的符号，并把光标左移到符号对内部。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { getPickingCandidate } from './lib/rime.js'

/**
 * Move cursor left one position using AppleScript
 * @param {Environment} env - The Rime environment
 */
function moveCursorToLeftForMacOS(env) {
  // 如果失效，在 Accessibility 里删除 Squirrel，然后重新添加
  // Accessibility 打开路径： System Preferences -> Security & Privacy -> Privacy -> Accessibility
  // Squirrel.app 位置：/Library/Input Methods/Squirrel.app
  const osascript = `osascript -e '
        tell application "System Events" to tell front process
            key code 123 # Left Arrow
        end tell
    '`
  env.popen(osascript)
}

/** @type {Record<string, string>} Mapping of opening symbols to their closing pairs */
const pairTable = {
  '`': '`',
  '"': '"',
  '“': '”',
  "'": "'",
  '‘': '’',
  '(': ')',
  '（': '）',
  '「': '」',
  '[': ']',
  '【': '】',
  '〔': '〕',
  '［': '］',
  '〚': '〛',
  '〘': '〙',
  '{': '}',
  '『': '』',
  '〖': '〗',
  '｛': '｝',
  '《': '》',
}
/**
 * 配对符号自动补全
 * @implements {Processor}
 */
export class PairsProcessor {
  /**
   * Initialize the processor
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('pairs.js init')
  }

  /**
   * Clean up when processor is unloaded
   * @param {Environment} env - The Rime environment
   */
  finalizer(env) {
    console.log('pairs.js finit')
  }

  /**
   * Process key events to handle paired symbol completion
   * @param {KeyEvent} keyEvent - The key event to process
   * @param {Environment} env - The Rime environment
   * @returns {ProcessResult} Result indicating if key was handled
   */
  process(keyEvent, env) {
    const context = env.engine.context
    if (context.hasMenu() || context.isComposing()) {
      const pickingCandidate = getPickingCandidate(keyEvent, context.lastSegment)
      if (!pickingCandidate) return 'kNoop'

      const symbol = pickingCandidate.text
      const pairedText = pairTable[symbol]
      if (pairedText) {
        env.engine.commitText(symbol + pairedText)
        context.clear()

        moveCursorToLeftForMacOS(env)

        return 'kAccepted'
      }
    }

    return 'kNoop'
  }
}
