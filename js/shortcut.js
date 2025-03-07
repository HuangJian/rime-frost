// 快捷指令：/deploy 布署、/screenshot 截屏、……
//    部署为两种插件：1. translator 提供候选项；2. processor 响应按键执行指令。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { getPickingCandidate } from "./lib/rime.js"

const shortcuts = [
  {
    input: '/deploy',
    desc: '重新布署 Squirrel 输入法，应用新配置',
    // -- 执行 `squirrel --reload` 指令并不立即布署，而是等到下一次重新激活输入法时才布署
    // -- 通过 applescript 快速输入两次 Ctrl+space 切换输入法来激活它
    // -- AppleScript key codes reference：
    // -- https://www.codemacs.com/coding/applescript/applescript-key-codes-reference.8288271.htm
    command: `
        "/Library/Input Methods/Squirrel.app/Contents/MacOS/squirrel" --reload && \
        osascript -e '
            tell application "System Events"
                key code 49 using control down # press Ctrl+space
                delay 0.1 # wait a bit, UI might be slow
                key code 49 using control down # press Ctrl+space
            end tell
        '
    `,
  },
  {
    input: '/screenshot',
    desc: '截图录屏',
    command: `open -a "Screenshot"`,
  },
]

/**
 * Initialize the translator/processor
 * @param {Environment} env - The Rime environment
 */
export function init(env) {
  console.log('shortcut.js init')
}

/**
 * Clean up when translator/processor is unloaded
 * @param {Environment} env - The Rime environment
 */
export function finit(env) {
  console.log('shortcut.js finit')
}

/**
 * Translate input to the shortcut commands
 * @param {string} input - The input string to translate
 * @param {Segment} segment - The input segment
 * @param {Environment} env - The Rime environment
 * @returns {Array<Candidate>} Array of translation candidates
 */
export function translate(input, segment, env) {
  if (input.length < 3 || input[0] !== '/') return []

  const lowerInput = input.toLowerCase()
  const candidates = shortcuts
    .filter((item) => item.input.startsWith(lowerInput))
    .map((item) => new Candidate('shortcut', segment.start, segment.end, item.input, item.desc, 999))

  if (candidates.length > 0) {
    segment.prompt = '〔快捷指令〕'
  }
  return candidates
}

/**
 * Process key events to execute shortcut command
 * @param {KeyEvent} keyEvent - The key event to process
 * @param {Environment} env - The Rime environment
 * @returns {ProcessResult} Result indicating if key was handled
 */
export function process(keyEvent, env) {
  const segment = env.engine.context.lastSegment
  if (!segment?.prompt?.includes('〔快捷指令〕')) return 'kNoop'

  const pickingCandidate = getPickingCandidate(keyEvent, segment)
  if (!pickingCandidate) return 'kNoop'

  const matchedShortcut = shortcuts.find((item) => item.input === pickingCandidate.text)
  if (matchedShortcut) {
    // Execute the command
    env.popen(matchedShortcut.command)
    env.engine.context.clear()
    return 'kAccepted'
  }

  return 'kNoop'
}
