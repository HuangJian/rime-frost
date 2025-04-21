/**
 *
 * @implements {Filter}
 *
 * @author https://github.com/HuangJian
 */
export class BenchmarkFilter {
  /**
   * Initialize the filter
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log('benchmark.filter.js init')
  }

  /**
   * Clean up when filter is unloaded
   */
  finalizer() {
    console.log('benchmark.filter.js finit')
  }

  /**
   * Filter a list of candidates
   * @param {Candidate[]} candidates - The candidates to filter
   * @param {Environment} env - The Rime environment
   * @return {Candidate[]} The filtered candidates
   */
  filter(candidates, env) {
    const input = env.engine.context.input
    if (input.endsWith('/bmregex')) {
      checkRegex(candidates, env.engine.context.input)
    } else if (input.endsWith('/bmfile')) {
      loadFile(env)
    }

    return candidates
  }
}

// $qjs$ Regex: duration = 13 ms, size = 2304, input = sm/bmregex   <- QuickJS-NG
// $jsc$ Regex: duration =  4 ms, size = 2304, input = sm/bmregex   <- JavaScriptCore
function checkRegex(candidates, input) {
  const start = Date.now() // jsc 不支持 performance.now()
  const checked = candidates
    .map(
      (c) =>
        c.comment.match(/〖(.+?)〗/) || // cn2en 插件提供的带调拼音
        c.comment.match(/［(.*?)］/), // 白霜拼音提供的不带调拼音
    )
    .filter((it) => it)

  const end = Date.now()
  console.log(`Regex: duration = ${end - start} ms, size = ${checked.length}, input = ${input}`)
}

// $qjs$ Read File: duration =  36 ms, size = 6734694  <- QuickJS-NG
// $qjs$ Load File: duration = 683 ms, size = 116617
// $jsc$ Read File: duration =  31 ms, size = 6734694  <- JavaScriptCore Interpreter
// $jsc$ Load File: duration =  97 ms, size = 116617
// $jsc$ Read File: duration =  21 ms, size = 6734694  <- JavaScriptCore FTL (most optimized JIT)
// $jsc$ Load File: duration =  84 ms, size = 116617
function loadFile(env) {
  console.log('loadFile starting...')
  const start = Date.now() // jsc 不支持 performance.now()
  const txtPath = `${env.userDataDir}/js/data/cedict_fixed.u8`
  const content = env.loadFile(txtPath)
  console.log(`Read File: time = ${Date.now() - start} ms, size = ${content.length}`)
  const map = new Map()
  content
    .split('\n')
    .filter((it) => !it.startsWith('#'))
    .forEach((line) => {
      const pos = line.indexOf('\t')
      if (pos !== -1) {
        const [word, info] = [line.slice(0, pos), line.slice(pos + 1)]
        map.set(word, info)
      }
    })
  console.log(`Load File: duration = ${Date.now() - start} ms, size = ${map.size}`)
}
