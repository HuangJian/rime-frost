// 农历日期
// -------------------------------------------------------
// 使用 JavaScript 重写，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

/** @type {Object.<string, string>}
 * @description 存储配置键值对的对象
 * 主要用于存储从配置文件中读取的农历相关配置
 */
const keys = {}

/** @type {string[]}
 * @description 天干数组，用于计算农历年份的天干
 * 包含十个天干：甲、乙、丙、丁、戊、己、庚、辛、壬、癸
 */
const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** @type {string[]}
 * @description 地支数组，用于计算农历年份的地支
 * 包含十二个地支：子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥
 */
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** @type {string[]}
 * @description 生肖数组，用于计算农历年份对应的生肖
 * 包含十二生肖：鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪
 */
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

/** @type {string[]}
 * @description 农历月份数组，用于转换数字月份为中文月份名称
 * 包含十二个月份：正、二、三、四、五、六、七、八、九、十、冬、腊
 */
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']

/** @type {string[]}
 * @description 农历日期数组，用于转换数字日期为农历日期表示
 * 包含三十个日期：初一至三十
 */
const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
]

/** @type {string[]}
 * @description 中文数字数组，用于将阿拉伯数字转换为中文数字
 * 包含零至九的中文数字表示
 */
const CHINESE_NUMS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九']

/** @type {number[]}
 * @description 农历年份数据数组，存储1900年至2100年的农历信息
 * 每个数字都是一个编码，包含了该年的闰月、大小月等信息
 */
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, 0x0a5b6,
  0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0, 0x0b4b5, 0x06a50,
  0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60,
  0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2,
  0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5,
  0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0,
  0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58,
  0x055c0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0,
  0x092d0, 0x0cab5, 0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3,
  0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2, 0x049b0,
  0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63,
]

/**
 * 计算指定年份的农历年总天数
 * @param {number} year - 公历年份
 * @returns {number} 返回该农历年的总天数
 */
function getLunarYearDays(year) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += LUNAR_INFO[year - 1900] & i ? 1 : 0
  }
  return sum + getLeapMonthDays(year)
}

/**
 * 获取指定年份的闰月月份
 * @param {number} year - 公历年份
 * @returns {number} 返回闰月的月份，如果该年没有闰月则返回0
 */
function getLeapMonth(year) {
  return LUNAR_INFO[year - 1900] & 0xf
}

/**
 * 获取指定年份闰月的天数
 * @param {number} year - 公历年份
 * @returns {number} 返回闰月的天数（29或30），如果该年没有闰月则返回0
 */
function getLeapMonthDays(year) {
  if (getLeapMonth(year)) {
    return LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29
  }
  return 0
}

/**
 * 获取指定年月的农历月份天数
 * @param {number} year - 公历年份
 * @param {number} month - 农历月份（1-12）
 * @returns {number} 返回该月的天数（29或30）
 */
function getLunarMonthDays(year, month) {
  return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29
}

/**
 * 将数字年份转换为中文数字表示
 * @param {number} year - 公历年份
 * @returns {string} 返回中文数字表示的年份
 * @example
 * getChineseYear(2025) // 返回"二〇二五"
 */
function getChineseYear(year) {
  return String(year)
    .split('')
    .map((digit) => CHINESE_NUMS[parseInt(digit)])
    .join('')
}

/**
 * 计算农历年份和偏移天数
 * @param {number} offset - 距离1900年1月31日的天数
 * @param {number} yearDays - 农历年总天数
 * @returns {{lunarYear: number, offset: number}} 返回农历年份和剩余偏移天数
 */
function calculateLunarYear(offset, yearDays) {
  let lunarYear = 1900
  for (; lunarYear < 2101 && offset > 0; lunarYear++) {
    yearDays = getLunarYearDays(lunarYear)
    offset -= yearDays
  }
  if (offset < 0) {
    offset += yearDays
    lunarYear--
  }
  return { lunarYear, offset }
}

/**
 * 计算农历月份信息
 * @param {number} lunarYear - 农历年份
 * @param {number} offset - 距离农历年初的天数
 * @returns {{lunarMonth: number, offset: number, isLeap: boolean}} 返回农历月份、剩余天数和是否闰月
 */
function calculateLunarMonth(lunarYear, offset) {
  const leapMonth = getLeapMonth(lunarYear)
  let isLeap = false
  let lunarMonth = 1
  let monthDays = 0

  for (; lunarMonth < 13 && offset >= 0; lunarMonth++) {
    if (leapMonth > 0 && lunarMonth === leapMonth + 1) {
      // Handle leap month first
      monthDays = getLeapMonthDays(lunarYear)
      if (offset < monthDays) {
        isLeap = true
        lunarMonth--
        break
      }
      offset -= monthDays
    }

    monthDays = getLunarMonthDays(lunarYear, lunarMonth)
    if (offset < monthDays) {
      break
    }
    offset -= monthDays
  }

  if (lunarMonth > 12) {
    lunarMonth = 12
    offset = monthDays - 1
  }

  return { lunarMonth, offset, isLeap }
}

/**
 * 计算农历日期完整信息
 * @param {Date} date - 公历日期对象
 * @returns {{lunarYear: number, lunarMonth: number, lunarDay: number, isLeap: boolean}} 返回农历年、月、日和是否闰月
 */
function calculateLunarDate(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  let offset = (Date.UTC(year, month - 1, day) - Date.UTC(1900, 0, 31)) / 86400000

  const { lunarYear, offset: yearOffset } = calculateLunarYear(offset, 0)
  const { lunarMonth, offset: monthOffset, isLeap } = calculateLunarMonth(lunarYear, yearOffset)
  const lunarDay = monthOffset + 1

  return { lunarYear, lunarMonth, lunarDay, isLeap }
}

/**
 * 获取简体中文格式的农历日期
 * @param {Date} date - 公历日期对象
 * @returns {string} 返回格式如"二〇二五年二月初四"的农历日期字符串
 */
function getSimpleLunarDate(date) {
  const { lunarYear, lunarMonth, lunarDay, isLeap } = calculateLunarDate(date)
  const month = `${isLeap ? '闰' : ''}${LUNAR_MONTHS[lunarMonth - 1]}`
  return `${getChineseYear(lunarYear)}年${month}月${LUNAR_DAYS[lunarDay - 1]}`
}

/**
 * 获取传统农历日期（天干地支）
 * @param {Date} date - 公历日期对象
 * @returns {string} 返回格式如"乙巳年二月初四"的农历日期字符串
 */
function getTraditionalLunarDate(date) {
  const { lunarYear, lunarMonth, lunarDay, isLeap } = calculateLunarDate(date)
  const cyclicalYear = lunarYear - 1900 + 36
  const yearGan = HEAVENLY_STEMS[cyclicalYear % 10]
  const yearZhi = EARTHLY_BRANCHES[cyclicalYear % 12]
  const month = `${isLeap ? '闰' : ''}${LUNAR_MONTHS[lunarMonth - 1]}`

  return `${yearGan}${yearZhi}年${month}月${LUNAR_DAYS[lunarDay - 1]}`
}

/**
 * 获取带生肖的传统农历日期字符串
 * @param {Date} date - 公历日期对象
 * @returns {string} 返回格式如"甲子年（鼠）正月初一"的农历日期字符串
 * @example
 * getTraditionalLunarDateWithZodiac(new Date(2020, 0, 25)) // 返回"庚子年（鼠）正月初一
 */
function getTraditionalLunarDateWithZodiac(date) {
  const { lunarYear, lunarMonth, lunarDay, isLeap } = calculateLunarDate(date)
  const cyclicalYear = lunarYear - 1900 + 36
  const yearGan = HEAVENLY_STEMS[cyclicalYear % 10]
  const yearZhi = EARTHLY_BRANCHES[cyclicalYear % 12]
  const zodiac = ZODIAC_ANIMALS[cyclicalYear % 12]
  const month = `${isLeap ? '闰' : ''}${LUNAR_MONTHS[lunarMonth - 1]}`

  return `${yearGan}${yearZhi}年（${zodiac}）${month}月${LUNAR_DAYS[lunarDay - 1]}`
}

function stringToDate(str) {
  const year = parseInt(str.substring(0, 4))
  const month = parseInt(str.substring(4, 6)) - 1
  const day = parseInt(str.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * 农历转换器
 * @implements {Translator}
 */
export class LunarTranslator {
  /**
   * 初始化农历转换器
   * @param {Environment} env - 输入法引擎环境对象
   */
  constructor(env) {
    console.log('lunar translator init')
    const config = env.engine.schema.config
    keys.lunar = config.getString(env.namespace + '/lunar') || 'nl'
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
    const candidates = []

    const yieldCandidate = (text, comment) =>
      candidates.push(new Candidate('date', segment.start, segment.end, text, comment || '', 999))

    let date =
      input === keys.lunar
        ? new Date() // 今天
        : input.startsWith(keys.lunar) && /^\d{8}$/.test(input.substring(keys.lunar.length))
        ? stringToDate(input.substring(keys.lunar.length)) // 格式为 nl20250204 的日期
        : null // 不处理

    if (date) {
      yieldCandidate(getSimpleLunarDate(date)) // 二〇二五年二月初四
      yieldCandidate(getTraditionalLunarDate(date)) // 乙巳年二月初四
      yieldCandidate(getTraditionalLunarDateWithZodiac(date)) // 乙巳年（蛇）二月初四
    } else if (input.startsWith(keys.lunar) && /^\d+$/.test(input.substring(keys.lunar.length))) {
      yieldCandidate('〔农历日期转换〕', '请输入指定日期的八位数字，如：20250303')
    }

    return candidates
  }
}
