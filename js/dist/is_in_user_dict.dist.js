var IsInUserDictFilter = class {
  constructor(env) {
    console.log('is_in_user_dict.js init')
  }
  finalizer() {
    console.log('is_in_user_dict.js finit')
  }
  filter(candidates, env) {
    candidates.forEach(function (candidate) {
      if (candidate.type === 'user_phrase') {
        candidate.comment = '*'
      } else if (candidate.type === 'sentence') {
        candidate.comment = '\u221E'
      }
    })
    return candidates
  }
}
export { IsInUserDictFilter }
