import { Solar } from 'lunar-typescript'

/**
 * 农历转换器
 * @implements {Translator}
 * @author https://github.com/HuangJian
 */
export class LunarTranslator {
  /**
   * @type {Object.<string, string>}
   * @description 存储配置键值对的对象
   * 用于存储从配置文件中读取的农历相关配置
   */
  #keys = {}

  /**
   * 初始化农历转换器
   * @param {Environment} env - 输入法引擎环境对象
   */
  constructor(env) {
    console.log('lunar translator init')
    const config = env.engine.schema.config
    this.#keys.lunar = config.getString(env.namespace + '/lunar') || 'nl'
  }

  /**
   * 清理农历转换器资源
   */
  finalizer() {
    console.log('lunar translator finit')
  }

  /**
   * 将输入转换为农历日期
   * @param {string} input - The input string to translate
   * @param {Segment} segment - The input segment
   * @param {Environment} env - The Rime environment
   * @returns {Array<Candidate>} Array of translation candidates
   */
  translate(input, segment, env) {
    if (!input.startsWith(this.#keys.lunar)) return []

    const candidates = []
    const yieldCandidate = (/** @type {string} */ text, /** @type {string} */ comment) =>
      candidates.push(new Candidate('date', segment.start, segment.end, text, comment || '', 999))

    const dateTimeString = input.substring(this.#keys.lunar.length)
    const solar =
      input === this.#keys.lunar
        ? Solar.fromDate(new Date()) // 当前时刻
        : /^\d{8}$/.test(dateTimeString)
        ? this.dateTimeStringToSolar(dateTimeString) // 格式为 nl20250204 的日期
        : null // 不处理

    if (solar) {
      const lunar = solar.getLunar()
      const y = lunar.getYearInGanZhi()
      const m = lunar.getMonthInChinese()
      const d = lunar.getDayInChinese()

      yieldCandidate(lunar.toString()) // 二〇二五年闰六月廿二

      yieldCandidate(`${y}年${m}月${d}`) // 乙巳年闰六月廿二
      yieldCandidate(`${y}年（${lunar.getYearShengXiao()}）${m}月${d}`) // 乙巳年（蛇）闰六月廿二
      const ymdShengxiao =
        `${y}（${lunar.getYearShengXiao()}）年` +
        `${m}（${lunar.getMonthShengXiao()}）月` +
        `${lunar.getDayInGanZhi()}（${lunar.getDayShengXiao()}）日`
      yieldCandidate(ymdShengxiao) // 乙巳（蛇）年闰六（猴）月丙辰（龙）日

      //   `二〇二五年二月十八 乙巳(蛇)年 己卯(兔)月 乙酉(鸡)日 午(马)时 纳音[覆灯火 城头土 泉中水 杨柳木] 星期一 ` +
      //   `北方玄武 星宿[危月燕](凶) 彭祖百忌[乙不栽植千株不长 酉不会客醉坐颠狂] ` +
      //   `喜神方位[乾](西北) 阳贵神方位[坤](西南) 阴贵神方位[坎](正北) 福神方位[坤](西南) 财神方位[艮](东北) 冲[(己卯)兔] 煞[东]`
      yieldCandidate(lunar.toFullString())
    } else {
      yieldCandidate(
        '〔农历日期转换〕',
        '请输入指定日期的八位数字，如：20250303。',
      )
    }

    return candidates
  }

  /**
   * @param {string} dateTimeString
   */

  /**
   * 将日期时间字符串转换为公历日期
   * @param {string} dateTimeString - 日期时间字符串，格式为 YYYYMMDDHHmmss
   * @returns {Solar | null} 转换后的公历日期对象，如果转换失败则返回 null
   */
  dateTimeStringToSolar(dateTimeString) {
    const match = dateTimeString.match(/^(\d{4})(\d{2})(\d{2})$/)
    if (!match) return null

    const [, year, month, day] = match.map((/** @type {string} */ it) => parseInt(it))
    try {
      return Solar.fromYmd(year, month, day)
    } catch (e) {
      //参数不合法，解析失败。返回当前时刻。
      return Solar.fromDate(new Date())
    }
  }
}
