// 自动补全配对的符号，并把光标左移到符号对内部。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { getPickingCandidate, ProcessResult } from './lib/rime.js'

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

const pairTable = {
  '`': '`',
  '"': '"',
  '“': '”',
  '\'': '\'',
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

export function init(env) {
  console.log('pairs.js init')
}
export function finit(env) {
  console.log('pairs.js finit')
}

export function process(keyEvent, env) {
  const context = env.engine.context
  if (context.hasMenu() || context.isComposing()) {
    const pickingCandidate = getPickingCandidate(keyEvent, context.lastSegment)
    if (!pickingCandidate) return ProcessResult.kNoop

    const symbol = pickingCandidate.text
    const pairedText = pairTable[symbol]
    if (pairedText) {
      env.engine.commitText(symbol + pairedText)
      context.clear()

      moveCursorToLeftForMacOS(env)

      return ProcessResult.kAccepted
    }
  }

  return ProcessResult.kNoop
}
