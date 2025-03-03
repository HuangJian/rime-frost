// Unicode
// 复制自： https://github.com/shewer/librime-lua-script/blob/main/lua/component/unicode.lua
// 示例：输入 U62fc 得到「拼」
// 触发前缀默认为 recognizer/patterns/unicode 的第 2 个字符，即 U
// 2024.02.26: 限定编码最大值
// 2024.06.01: 部分变量初始化，条件语句调整。
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

const path = 'recognizer/patterns/unicode'
let keyword = null

export function init(env) {
  console.log(`unicode translator init`)

  // 获取 recognizer/patterns/unicode 的第 2 个字符作为触发前缀
  const pattern = env.engine.schema.config.getString(path) || '^U'
  keyword = pattern.substring(1, 2)
}

export function finit(env) {
  console.log(`unicode translator finit`)
}

export function translate(input, segment, env) {
  if (!segment.hasTag('unicode') || input.length < 3) return []

  const candidates = []
  const yieldCandidate = (text, comment) =>
    candidates.push(new Candidate('unicode', segment.start, segment.end, text, comment || ''))

  const match = input.match(new RegExp(keyword + '([0-9a-fA-F]+)'))
  if (match && match[1]) {
    const code = parseInt(match[1], 16)
    if (code > 0x10ffff) {
      yieldCandidate('数值超限！')
      return candidates
    }

    const text = String.fromCodePoint(code)
    yieldCandidate(text, `U${code.toString(16)}`)

    if (code < 0x10000) {
      for (let i = 0; i < 16; i++) {
        const text = String.fromCodePoint(code * 16 + i)
        yieldCandidate(text, `U${code.toString(16)}~${i.toString(16)}`)
      }
    }
  }
  return candidates
}
