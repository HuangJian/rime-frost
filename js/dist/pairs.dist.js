var KeyRepr = {
  BackSpace: 'BackSpace',
  Tab: 'Tab',
  Linefeed: 'Linefeed',
  Clear: 'Clear',
  Return: 'Return',
  Pause: 'Pause',
  Sys_Req: 'Sys_Req',
  Escape: 'Escape',
  Delete: 'Delete',
  Home: 'Home',
  Left: 'Left',
  Up: 'Up',
  Right: 'Right',
  Down: 'Down',
  Prior: 'Prior',
  Page_Up: 'Page_Up',
  Next: 'Next',
  Page_Down: 'Page_Down',
  End: 'End',
  Begin: 'Begin',
  Shift_L: 'Shift_L',
  Shift_R: 'Shift_R',
  Control_L: 'Control_L',
  Control_R: 'Control_R',
  Meta_L: 'Meta_L',
  Meta_R: 'Meta_R',
  Alt_L: 'Alt_L',
  Alt_R: 'Alt_R',
  Super_L: 'Super_L',
  Super_R: 'Super_R',
  Hyper_L: 'Hyper_L',
  Hyper_R: 'Hyper_R',
  Caps_Lock: 'Caps_Lock',
  Shift_Lock: 'Shift_Lock',
  Scroll_Lock: 'Scroll_Lock',
  Num_Lock: 'Num_Lock',
  Select: 'Select',
  Print: 'Print',
  Execute: 'Execute',
  Insert: 'Insert',
  Undo: 'Undo',
  Redo: 'Redo',
  Menu: 'Menu',
  Find: 'Find',
  Cancel: 'Cancel',
  Help: 'Help',
  Break: 'Break',
  space: 'space',
  exclam: 'exclam',
  quotedbl: 'quotedbl',
  numbersign: 'numbersign',
  dollar: 'dollar',
  percent: 'percent',
  ampersand: 'ampersand',
  apostrophe: 'apostrophe',
  parenleft: 'parenleft',
  parenright: 'parenright',
  asterisk: 'asterisk',
  plus: 'plus',
  comma: 'comma',
  minus: 'minus',
  period: 'period',
  slash: 'slash',
  colon: 'colon',
  semicolon: 'semicolon',
  less: 'less',
  equal: 'equal',
  greater: 'greater',
  question: 'question',
  at: 'at',
  bracketleft: 'bracketleft',
  backslash: 'backslash',
  bracketright: 'bracketright',
  asciicircum: 'asciicircum',
  underscore: 'underscore',
  grave: 'grave',
  braceleft: 'braceleft',
  bar: 'bar',
  braceright: 'braceright',
  asciitilde: 'asciitilde',
  KP_Space: 'KP_Space',
  KP_Tab: 'KP_Tab',
  KP_Enter: 'KP_Enter',
  KP_Delete: 'KP_Delete',
  KP_Home: 'KP_Home',
  KP_Left: 'KP_Left',
  KP_Up: 'KP_Up',
  KP_Right: 'KP_Right',
  KP_Down: 'KP_Down',
  KP_Prior: 'KP_Prior',
  KP_Page_Up: 'KP_Page_Up',
  KP_Next: 'KP_Next',
  KP_Page_Down: 'KP_Page_Down',
  KP_End: 'KP_End',
  KP_Begin: 'KP_Begin',
  KP_Insert: 'KP_Insert',
  KP_Equal: 'KP_Equal',
  KP_Multiply: 'KP_Multiply',
  KP_Add: 'KP_Add',
  KP_Subtract: 'KP_Subtract',
  KP_Divide: 'KP_Divide',
  KP_Decimal: 'KP_Decimal',
  KP_0: 'KP_0',
  KP_1: 'KP_1',
  KP_2: 'KP_2',
  KP_3: 'KP_3',
  KP_4: 'KP_4',
  KP_5: 'KP_5',
  KP_6: 'KP_6',
  KP_7: 'KP_7',
  KP_8: 'KP_8',
  KP_9: 'KP_9',
}
function getPickingCandidate(keyEvent, segment) {
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
    return segment?.getCandidateAt(idx)
  }
  return null
}
function moveCursorToLeftForMacOS(env) {
  const osascript = `osascript -e '
        tell application "System Events" to tell front process
            key code 123 # Left Arrow
        end tell
    '`
  env.popen(osascript)
}
var pairTable = {
  '`': '`',
  '"': '"',
  '\u201C': '\u201D',
  "'": "'",
  '\u2018': '\u2019',
  '(': ')',
  '\uFF08': '\uFF09',
  '\u300C': '\u300D',
  '[': ']',
  '\u3010': '\u3011',
  '\u3014': '\u3015',
  '\uFF3B': '\uFF3D',
  '\u301A': '\u301B',
  '\u3018': '\u3019',
  '{': '}',
  '\u300E': '\u300F',
  '\u3016': '\u3017',
  '\uFF5B': '\uFF5D',
  '\u300A': '\u300B',
}
var PairsProcessor = class {
  constructor(env) {
    console.log('pairs.js init')
  }
  finalizer() {
    console.log('pairs.js finit')
  }
  process(keyEvent, env) {
    const context = env.engine.context
    if (context.hasMenu() && context.lastSegment) {
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
export { PairsProcessor }
