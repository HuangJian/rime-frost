;(() => {
  var BenchmarkFilter = class {
    constructor(env) {
      console.log('benchmark.filter.js init')
    }
    finalizer() {
      console.log('benchmark.filter.js finit')
    }
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
  function checkRegex(candidates, input) {
    const start = Date.now()
    const checked = candidates
      .map((c) => c.comment.match(/〖(.+?)〗/) || c.comment.match(/［(.*?)］/))
      .filter((it) => it)
    const end = Date.now()
    console.log(`Regex: duration = ${end - start} ms, size = ${checked.length}, input = ${input}`)
  }
  function loadFile(env) {
    console.log('loadFile starting...')
    const start = Date.now()
    const txtPath = `${env.userDataDir}/js/data/cedict_fixed.u8`
    const content = env.loadFile(txtPath)
    console.log(`Read File: time = ${Date.now() - start} ms, size = ${content.length}`)
    const map = new Map()
    content
      .split('\n')
      .filter((it) => !it.startsWith('#'))
      .forEach((line) => {
        const pos = line.indexOf('	')
        if (pos !== -1) {
          const [word, info] = [line.slice(0, pos), line.slice(pos + 1)]
          map.set(word, info)
        }
      })
    console.log(`Load File: duration = ${Date.now() - start} ms, size = ${map.size}`)
  }
  globalThis.iife_instance_benchmark_filter_iife_js = new BenchmarkFilter()
})()
