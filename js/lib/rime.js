// 按键速查
// https://github.com/LEOYoon-Tsaw/Rime_collections/blob/master/Rime_description.md
// （没有 Command 键，不支持）
// accept 和 send 可用字段除 A-Za-z0-9 外，还包含以下键盘上实际有的键：
// （区分大小写）
export const KeyRepr = {
  'BackSpace': 'BackSpace', // 退格
  'Tab': 'Tab', // 水平定位符
  'Linefeed': 'Linefeed', // 换行
  'Clear': 'Clear', // 清除
  'Return': 'Return', // 回车
  'Pause': 'Pause', // 暂停
  'Sys_Req': 'Sys_Req', // 印屏
  'Escape': 'Escape', // 退出
  'Delete': 'Delete', // 删除
  'Home': 'Home', // 原位
  'Left': 'Left', // 左箭头
  'Up': 'Up', // 上箭头
  'Right': 'Right', // 右箭头
  'Down': 'Down', // 下箭头
  'Prior': 'Prior', // 上翻
  'Page_Up': 'Page_Up', // 上翻
  'Next': 'Next', // 下翻
  'Page_Down': 'Page_Down', // 下翻
  'End': 'End', // 末位
  'Begin': 'Begin', // 始位
  'Shift_L': 'Shift_L', // 左Shift
  'Shift_R': 'Shift_R', // 右Shift
  'Control_L': 'Control_L', // 左Ctrl
  'Control_R': 'Control_R', // 右Ctrl
  'Meta_L': 'Meta_L', // 左Meta
  'Meta_R': 'Meta_R', // 右Meta
  'Alt_L': 'Alt_L', // 左Alt
  'Alt_R': 'Alt_R', // 右Alt
  'Super_L': 'Super_L', // 左Super
  'Super_R': 'Super_R', // 右Super
  'Hyper_L': 'Hyper_L', // 左Hyper
  'Hyper_R': 'Hyper_R', // 右Hyper
  'Caps_Lock': 'Caps_Lock', // 大写锁
  'Shift_Lock': 'Shift_Lock', // 上档锁
  'Scroll_Lock': 'Scroll_Lock', // 滚动锁
  'Num_Lock': 'Num_Lock', // 小键板锁
  'Select': 'Select', // 选定
  'Print': 'Print', // 打印
  'Execute': 'Execute', // 运行
  'Insert': 'Insert', // 插入
  'Undo': 'Undo', // 还原
  'Redo': 'Redo', // 重做
  'Menu': 'Menu', // 菜单
  'Find': 'Find', // 搜寻
  'Cancel': 'Cancel', // 取消
  'Help': 'Help', // 帮助
  'Break': 'Break', // 中断
  'space': 'space', // 空格
  'exclam': 'exclam', // !
  'quotedbl': 'quotedbl', // "
  'numbersign': 'numbersign', // #
  'dollar': 'dollar', // $
  'percent': 'percent', // %
  'ampersand': 'ampersand', // &
  'apostrophe': 'apostrophe', // '
  'parenleft': 'parenleft', // (
  'parenright': 'parenright', // )
  'asterisk': 'asterisk', // *
  'plus': 'plus', // +
  'comma': 'comma', // ,
  'minus': 'minus', // -
  'period': 'period', // .
  'slash': 'slash', // /
  'colon': 'colon', // :
  'semicolon': 'semicolon', // ;
  'less': 'less', // <
  'equal': 'equal', // =
  'greater': 'greater', // >
  'question': 'question', // ?
  'at': 'at', // @
  'bracketleft': 'bracketleft', // [
  'backslash': 'backslash', // \
  'bracketright': 'bracketright', // ]
  'asciicircum': 'asciicircum', // ^
  'underscore': 'underscore', // _
  'grave': 'grave', // `
  'braceleft': 'braceleft', // {
  'bar': 'bar', // |
  'braceright': 'braceright', // }
  'asciitilde': 'asciitilde', // ~
  'KP_Space': 'KP_Space', // 小键板空格
  'KP_Tab': 'KP_Tab', // 小键板水平定位符
  'KP_Enter': 'KP_Enter', // 小键板回车
  'KP_Delete': 'KP_Delete', // 小键板删除
  'KP_Home': 'KP_Home', // 小键板原位
  'KP_Left': 'KP_Left', // 小键板左箭头
  'KP_Up': 'KP_Up', // 小键板上箭头
  'KP_Right': 'KP_Right', // 小键板右箭头
  'KP_Down': 'KP_Down', // 小键板下箭头
  'KP_Prior': 'KP_Prior', // 小键板上翻
  'KP_Page_Up': 'KP_Page_Up', // 小键板上翻
  'KP_Next': 'KP_Next', // 小键板下翻
  'KP_Page_Down': 'KP_Page_Down', // 小键板下翻
  'KP_End': 'KP_End', // 小键板末位
  'KP_Begin': 'KP_Begin', // 小键板始位
  'KP_Insert': 'KP_Insert', // 小键板插入
  'KP_Equal': 'KP_Equal', // 小键板等于
  'KP_Multiply': 'KP_Multiply', // 小键板乘号
  'KP_Add': 'KP_Add', // 小键板加号
  'KP_Subtract': 'KP_Subtract', // 小键板减号
  'KP_Divide': 'KP_Divide', // 小键板除号
  'KP_Decimal': 'KP_Decimal', // 小键板小数点
  'KP_0': 'KP_0', // 小键板0
  'KP_1': 'KP_1', // 小键板1
  'KP_2': 'KP_2', // 小键板2
  'KP_3': 'KP_3', // 小键板3
  'KP_4': 'KP_4', // 小键板4
  'KP_5': 'KP_5', // 小键板5
  'KP_6': 'KP_6', // 小键板6
  'KP_7': 'KP_7', // 小键板7
  'KP_8': 'KP_8', // 小键板8
  'KP_9': 'KP_9', // 小键板9
}

export const ProcessResult = {
  kRejected: 0, // do the OS default processing
  kAccepted: 1, // consume it
  kNoop: 2, // leave it to other processors
}

/**
 * 根据键盘输入返回选择的候选项。
 * 支持使用空格键/回车键选择第一个候选项，使用数字键1-9选择对应序号的候选项,0选择第十个候选项。
 *
 * @param {Object} keyEvent - 键盘事件对象
 * @param {string} keyEvent.repr - 按键的字符串表示
 * @param {Object} segment - 包含候选项信息的片段对象
 * @param {number} segment.candidateSize - 可用候选项的总数
 * @param {Function} segment.getCandidateAt - 通过索引获取特定候选项的函数
 *
 * @returns {Object|null} 如果选择有效则返回所选的候选项对象，否则返回null
 */
export function getPickingCandidate(keyEvent, segment) {
  const keyValue = keyEvent.repr
  let idx = -1

  if (keyValue === KeyRepr.space || keyValue === KeyRepr.Return) {
    idx = 0
  } else if (/^[1-9]$/.test(keyValue)) {
    idx = parseInt(keyValue) - 1
  } else if (keyValue === '0') {
    idx = 9
  }

  if (idx >= 0 && idx < segment?.candidateSize) {
    return segment?.getCandidateAt(idx) // Get specific candidate (0-based)
  }
  return null
}
