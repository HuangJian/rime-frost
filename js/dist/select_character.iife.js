;(() => {
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
  var keys = {}
  var SelectCharProcessor = class {
    constructor(env) {
      console.log('select_character.js init')
      const config = env.engine.schema.config
      keys.firstKey = config.getString('key_binder/select_first_character')
      keys.lastKey = config.getString('key_binder/select_last_character')
      const isInvalid = (key) => !key || !KeyRepr[key]
      if (isInvalid(keys.firstKey) || isInvalid(keys.lastKey)) {
        throw new Error('select_character.js init: \u8BF7\u914D\u7F6E\u6309\u952E')
      }
    }
    finalizer() {
      console.log('select_character.js finit')
    }
    process(keyEvent, env) {
      if (keyEvent.release || !keys.firstKey || !keys.lastKey) return 'kNoop'
      const context = env.engine.context
      if (!context.hasMenu()) return 'kNoop'
      const commitText = (text2) => {
        env.engine.commitText(text2)
        context.clear()
        return 'kAccepted'
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
      return 'kNoop'
    }
  }
  globalThis.iife_instance_select_character_iife_js = new SelectCharProcessor()
})()
