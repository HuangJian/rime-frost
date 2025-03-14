// author: https://github.com/ChaosAlphard
// 说明 https://github.com/gaboolic/rime-shuangpin-fuzhuma/pull/41
// -------------------------------------------------------
// 使用 JavaScript 实现，适配 librime-qjs 插件系统。
// by @[HuangJian](https://github.com/HuangJian)

import { BigDecimal, DecimalExpressionParser } from './lib/bigdecimal.js'

/**
 * 简单计算器
 * @implements {Translator}
 */
export class Calculator {
  /**
   * Initialize the calculator translator
   * @param {Environment} env - The Rime environment
   */
  constructor(env) {
    console.log(`calculator translator init`)
  }

  /**
   * Clean up the calculator translator
   * @param {Environment} env - The Rime environment
   */
  finalizer(env) {
    console.log(`calculator translator finit`)
  }

  /**
   * 简单计算器
   * @param {string} input - The input string to translate
   * @param {Segment} segment - The input segment
   * @param {Environment} env - The Rime environment
   * @returns {Array<Candidate>} Array of translation candidates
   */
  translate(input, segment, env) {
    if (!input.startsWith('/js') && !input.startsWith('/calc')) {
      return []
    }

    segment.prompt = '〔数学计算〕 /calc 或 /js 触发'

    // 提取算式
    const express = input.replace(/^(\/calc|\/js)/, '').trim()
    // 算式长度 < 1 直接终止(没有计算意义)
    if (express.length < 1) return []

    const candidates = []
    try {
      const result = calcSimpleMath(express) || calcWithOperators(express)

      // Handle null and undefined results
      const resultStr = result === null || result === undefined || isNaN(result) ? 'null' : result.toString()

      candidates.push(new Candidate(input, segment.start, segment.end, resultStr, ''))
      candidates.push(new Candidate(input, segment.start, segment.end, `${express}=${resultStr}`, ''))
      candidates.push(new Candidate(input, segment.start, segment.end, `\`${express}=${resultStr}\``, ''))
    } catch (error) {
      candidates.push(new Candidate(input, segment.start, segment.end, express, '解析失败: ' + error.message))
    }

    candidates.push(
      new Candidate(
        input,
        segment.start,
        segment.end,
        '〔支持常数〕',
        'e = 2.718281828459, pi(π) = 3.1415926535898',
      ),
    )

    const hints =
      'random(随机数), avg(平均), var(方差), fact(阶乘)\n' +
      '\t\tabs(绝对值), ceil(向上取整), floor(向下取整), round(四舍五入), sign(符号)\n' +
      '\t\tmin(最小值), max(最大值), pow(幂), hypot(求直角三角形斜边)\n' +
      '\t\texp(自然对数), log(底数为10的对数), log10(底数为10的对数), log2(底数为2的对数)\n' +
      '\t\tclz32(32位整数的前导零个数), expm1(指数减1), log1p(1+对数)\n' +
      '\t\tcbrt(立方根), imul(整数乘法), fround(单精度浮点数), trunc(截断整数)\n' +
      '\t\tsin(正弦), cos(余弦), tan(正切), asin(反正弦), acos(反余弦), atan(反正切)\n' +
      '\t\tsinh(双曲正弦), cosh(双曲余弦), tanh(双曲正切), atan2(反正切), atanh(反双曲正切)'
    candidates.push(new Candidate(input, segment.start, segment.end, '〔支持函数〕', hints))

    return candidates
  }
}

/**
 * Calculate the result of a simple math expression
 * @param {string} expression - The math expression to calculate
 * @returns {number|null} The result of the calculation or null if invalid
 */
function calcSimpleMath(expression) {
  if (/^[0-9.()\+\-*/]+$/.test(expression)) {
    // 简单的四则运算，使用BigDecimal计算，以保证精度 e.g. /calc0.3-0.1 => 0.2
    const exprWithBigDecimal = DecimalExpressionParser.generateBigDecimalExpression(expression)
    if (exprWithBigDecimal) {
      const calculate = new Function('BigDecimal', ` return ${exprWithBigDecimal}; `)
      return calculate(BigDecimal)
    }
  }
  return null
}

/**
 * Calculate the result of a math expression with operators
 * @param {string} expression - The math expression to calculate
 * @returns {number|null} The result of the calculation or null if invalid
 */
function calcWithOperators(expression) {
  const processedExpr = expression
    // 替换[0-9]!字符为fact([0-9])以实现阶乘
    .replace(/([0-9]+)!/g, 'fact($1)')
    // 替换 e 为Math.E，需要其前后字符均不为数字或字母
    .replace(/(?<!\w)e(?!\w)/gi, 'operators.E')
    // 替换 pi 为Math.PI，需要其前后字符均不为数字或字母
    .replace(/(?<!\w)pi(?!\w)/gi, 'operators.PI')
    // Replace all operators function calls
    .replace(new RegExp(`(?<!\\w)(${Object.keys(operators).join('|')})\\(`, 'g'), (match, p1) => {
      return `operators.${p1}(`
    })

  // Using Function constructor with Math object and operators
  const calculate = new Function('operators', ` return ${processedExpr}; `)
  return calculate(operators)
}

/**
 * Mathematical operators and functions available for calculation
 * @type {Object.<string, number|function>}
 */
const operators = {
  // Constants
  E: Math.E,
  PI: Math.PI,

  // Basic Math functions
  abs: (x) => Math.abs(x),
  ceil: (x) => Math.ceil(x),
  floor: (x) => Math.floor(x),
  round: (x) => Math.round(x),
  sign: (x) => Math.sign(x),
  sqrt: (x) => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),

  // Trigonometric functions
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  atan2: (y, x) => Math.atan2(y, x),

  // Hyperbolic functions
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  asinh: (x) => Math.asinh(x),
  acosh: (x) => Math.acosh(x),
  atanh: (x) => Math.atanh(x),

  // Exponential and logarithmic functions
  exp: (x) => Math.exp(x),
  log: (x) => Math.log(x),
  log10: (x) => Math.log10(x),
  log2: (x) => Math.log2(x),

  // Exponential and logarithmic functions
  clz32: (x) => Math.clz32(x),
  expm1: (x) => Math.expm1(x),
  log1p: (x) => Math.log1p(x),

  // Miscellaneous functions
  cbrt: (x) => Math.cbrt(x),
  imul: (x, y) => Math.imul(x, y),
  fround: (x) => Math.fround(x),
  trunc: (x) => Math.trunc(x),

  // Aggregate functions
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  hypot: (...args) => Math.hypot(...args),

  // Custom functions
  /**
   * Generate a random number within a range
   * @param {number} [min] - Minimum value (inclusive)
   * @param {number} [max] - Maximum value (exclusive)
   * @returns {number} Random number
   */
  random: (min, max) => {
    if (!min) return Math.random()
    if (!max) return Math.floor(Math.random() * min + 1)
    return Math.floor(Math.random() * (max - min) + min)
  },

  /**
   * 将角度从弧度转换为度 e.g. deg(π) = 180
   * @param {number} x - Angle in radians
   * @returns {number} Angle in degrees
   */
  deg: (x) => (x * 180) / Math.PI,

  /**
   * 将角度从度转换为弧度 e.g. rad(180) = π
   * @param {number} x - Angle in degrees
   * @returns {number} Angle in radians
   */
  rad: (x) => (x * Math.PI) / 180,

  /**
   * avg(数字1, 数字2, ...) 计算平均值
   * @param {...number} args - Numbers to average
   * @returns {number} Average value
   * @throws {Error} If no arguments provided
   */
  avg: (...args) => {
    if (args.length === 0) throw new Error('样本数量不能为0')
    return args.reduce((sum, val) => sum + val, 0) / args.length
  },

  /**
   * var(数字1, 数字2,...) 计算方差
   * @param {...number} args - Numbers to calculate variance
   * @returns {number} Variance value
   * @throws {Error} If no arguments provided
   */
  var: (...args) => {
    if (args.length === 0) throw new Error('样本数量不能为0')
    // @ts-ignore
    const mean = operators.avg(...args)
    return args.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / args.length
  },

  /**
   * fact(数字) 计算阶乘
   * @param {number} x - Number to calculate factorial
   * @returns {number} Factorial value
   * @throws {Error} If number is negative
   */
  fact: (x) => {
    if (x < 0) throw new Error('阶乘不能为负数')
    if (x === 0 || x === 1) return 1
    let result = 1
    for (let i = 1; i <= x; i++) {
      result *= i
    }
    return result
  },
}
