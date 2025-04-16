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
var SlashProcessor = class {
  direction = KeyRepr.Down
  constructor(env) {
    console.log('slash.js init')
  }
  finalizer() {
    console.log('slash.js finit')
  }
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
export { SlashProcessor }
