;(() => {
  var keys = {}
  var DateTranslator = class {
    constructor(env) {
      console.log(`date translator init`)
      const config = env.engine.schema.config
      const namespace = env.namespace
      keys.date = config.getString(namespace + '/date') || 'rq'
      keys.time = config.getString(namespace + '/time') || 'sj'
      keys.week = config.getString(namespace + '/week') || 'xq'
      keys.datetime = config.getString(namespace + '/datetime') || 'dt'
      keys.timestamp = config.getString(namespace + '/timestamp') || 'ts'
    }
    finalizer() {
      console.log(`date translator finit`)
    }
    translate(input, segment, env) {
      const now = new Date()
      const candidates = []
      const yieldCandidate = (text) =>
        candidates.push(new Candidate('date', segment.start, segment.end, text, '', 100))
      if (input === keys.date) {
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const date = String(now.getDate()).padStart(2, '0')
        yieldCandidate(`${year}-${month}-${date}`)
        yieldCandidate(`${year}/${month}/${date}`)
        yieldCandidate(`${year}.${month}.${date}`)
        yieldCandidate(`${year}${month}${date}`)
        yieldCandidate(`${year}\u5E74${Number(month)}\u6708${Number(date)}\u65E5`)
      } else if (input === keys.time) {
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        yieldCandidate(`${hours}:${minutes}`)
        yieldCandidate(`${hours}:${minutes}:${seconds}`)
        yieldCandidate(`${hours}${minutes}${seconds}`)
      } else if (input === keys.week) {
        const weekTable = ['\u65E5', '\u4E00', '\u4E8C', '\u4E09', '\u56DB', '\u4E94', '\u516D']
        const weekDay = weekTable[now.getDay()]
        yieldCandidate('\u661F\u671F' + weekDay)
        yieldCandidate('\u793C\u62DC' + weekDay)
        yieldCandidate('\u5468' + weekDay)
      } else if (input === keys.datetime) {
        const offset = '+08:00'
        const isoDate = now.toISOString().slice(0, 19)
        yieldCandidate(isoDate + offset)
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        yieldCandidate(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`)
        yieldCandidate(`${year}${month}${day}${hours}${minutes}${seconds}`)
      } else if (input === keys.timestamp) {
        yieldCandidate(Math.floor(now.getTime() / 1e3).toString())
      }
      return candidates
    }
  }
  globalThis.iife_instance_date_translator_iife_js = new DateTranslator()
})()
