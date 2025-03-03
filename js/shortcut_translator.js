// 快捷指令：/deploy 布署、/screenshot 截屏、……
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

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

export function init() {
  console.log('shortcut_translator.js init')
}

export function finit() {
  console.log('shortcut_translator.js finit')
}

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
