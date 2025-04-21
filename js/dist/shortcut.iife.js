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
  var shortcuts = [
    {
      input: '/deploy',
      desc: '\u91CD\u65B0\u5E03\u7F72 Squirrel \u8F93\u5165\u6CD5\uFF0C\u5E94\u7528\u65B0\u914D\u7F6E',
      command: `
        "/Library/Input Methods/Squirrel.app/Contents/MacOS/squirrel" --reload &&         osascript -e '
            tell application "System Events"
                key code 49 using control down # press Ctrl+space
                delay 0.1 # wait a bit, UI might be slow
                key code 49 using control down # press Ctrl+space
            end tell
        '
    `,
      os: ['macOS'],
    },
    {
      input: '/screenshot',
      desc: '\u622A\u56FE\u5F55\u5C4F',
      command: `open -a "Screenshot"`,
      os: ['macOS'],
    },
  ]
  var Shortcut = class {
    #shortcuts = []
    constructor(env) {
      console.log('shortcut.js init')
      this.#shortcuts = shortcuts.filter((item) => item.os.includes(env.os.name))
    }
    finalizer() {
      console.log('shortcut.js finit')
    }
    translate(input, segment, env) {
      if (input.length < 3 || input[0] !== '/') return []
      const lowerInput = input.toLowerCase()
      const candidates = this.#shortcuts
        .filter((item) => item.input.startsWith(lowerInput))
        .map((item) => new Candidate('shortcut', segment.start, segment.end, item.input, item.desc, 999))
      if (candidates.length > 0) {
        segment.prompt = '\u3014\u5FEB\u6377\u6307\u4EE4\u3015'
      }
      return candidates
    }
    process(keyEvent, env) {
      if (this.#shortcuts.length === 0 || !env.engine.context.hasMenu()) return 'kNoop'
      const segment = env.engine.context.lastSegment
      if (!segment?.prompt?.includes('\u3014\u5FEB\u6377\u6307\u4EE4\u3015')) return 'kNoop'
      const pickingCandidate = getPickingCandidate(keyEvent, segment)
      if (!pickingCandidate) return 'kNoop'
      const matchedShortcut = this.#shortcuts.find((item) => item.input === pickingCandidate.text)
      if (matchedShortcut) {
        env.popen(matchedShortcut.command)
        env.engine.context.clear()
        return 'kAccepted'
      }
      return 'kNoop'
    }
  }
  globalThis.iife_instance_shortcut_iife_js = new Shortcut()
})()
