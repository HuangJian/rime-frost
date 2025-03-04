//  以词定字
//  原脚本 https://github.com/BlindingDark/rime-lua-select-character
//  删除了默认按键 [ ]，和方括号翻页冲突，需要在 key_binder 下指定才能生效
//  20230526195910 不再错误地获取commit_text，而是直接获取get_selected_candidate().text
//  20240128141207 重写：将读取设置移动到 init 方法中；简化中文取字方法；预先判断候选存在与否，无候选取 input
//  20240508111725 当候选字数为 1 时，快捷键使该字上屏
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { ProcessResult, KeyRepr } from './lib/rime.js'

let keys = {}

export function init(env) {
  console.log('select_character.js init')

  const config = env.engine.schema.config
  keys.firstKey = config.getString('key_binder/select_first_character')
  keys.lastKey = config.getString('key_binder/select_last_character')

  const isInvalid = (key) => !key || !KeyRepr[key]
  if (isInvalid(keys.firstKey) || isInvalid(keys.lastKey)) {
    // 在 init 方法中抛出错误，librime-qjs 插件引擎将认为脚本加载失败，后继不会调用 process 方法
    throw new Error('select_character.js init: 请配置按键')
  }
}

export function finit(env) {
  console.log('select_character.js finit')
}

export function process(keyEvent, env) {
  if (keyEvent.release || !keys.firstKey || !keys.lastKey) return ProcessResult.kNoop

  const context = env.engine.context
  if (!context.isComposing() && !context.hasMenu()) return ProcessResult.kNoop

  const commitText = (text) => {
    env.engine.commitText(text)
    context.clear()
    return ProcessResult.kAccepted
  }

  const text = context.lastSegment?.selectedCandidate?.text || context.input || ''
  const keyRepr = keyEvent.repr
  if (text.length > 1) {
    if (keyRepr === keys.firstKey) {
      return commitText(text[0])
    } else if (keyRepr === keys.lastKey) {
      return commitText(text[text.length - 1])
    }
  } else if (text.length === 1 && (keyRepr === keys.firstKey || keyRepr === keys.lastKey)) {
    return commitText(text)
  }

  return ProcessResult.kNoop
}
