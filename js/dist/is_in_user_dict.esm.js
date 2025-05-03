var IsInUserDictFilter = class {
  constructor(env) {
    console.log('is_in_user_dict.js init')
  }
  finalizer() {
    console.log('is_in_user_dict.js finit')
  }
  *filter(iter, env) {
    for (let idx = 0, candidate; idx < 100 && (candidate = iter.next()); idx++) {
      if (candidate.type === 'user_phrase') {
        candidate.comment = '*'
      } else if (candidate.type === 'sentence') {
        candidate.comment = '\u221E'
      }
      yield candidate
    }
    return iter
  }
}
export { IsInUserDictFilter }
