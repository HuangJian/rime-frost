var BigDecimal = class _BigDecimal {
  #coefficient
  #scale
  constructor(value) {
    if (value instanceof _BigDecimal) {
      this.#coefficient = value.#coefficient
      this.#scale = value.#scale
      return
    }
    let str = String(value).trim()
    this.#scale = 0
    const decimalPos = str.indexOf('.')
    if (decimalPos !== -1) {
      this.#scale = str.length - decimalPos - 1
      str = str.replace('.', '')
    }
    const ePos = str.toLowerCase().indexOf('e')
    if (ePos !== -1) {
      const exp = parseInt(str.slice(ePos + 1))
      str = str.slice(0, ePos)
      this.#scale -= exp
    }
    this.#coefficient = BigInt(str)
  }
  static #alignScales(a, b) {
    const scaleDiff = a.#scale - b.#scale
    if (scaleDiff === 0) {
      return [a.#coefficient, b.#coefficient]
    }
    if (scaleDiff > 0) {
      return [a.#coefficient, b.#coefficient * BigInt(10 ** scaleDiff)]
    }
    return [a.#coefficient * BigInt(10 ** -scaleDiff), b.#coefficient]
  }
  add(other) {
    const bd = new _BigDecimal(other)
    const maxScale = Math.max(this.#scale, bd.#scale)
    const [a, b] = _BigDecimal.#alignScales(this, bd)
    const result = new _BigDecimal('0')
    result.#coefficient = a + b
    result.#scale = maxScale
    return result
  }
  subtract(other) {
    const bd = new _BigDecimal(other)
    const maxScale = Math.max(this.#scale, bd.#scale)
    const [a, b] = _BigDecimal.#alignScales(this, bd)
    const result = new _BigDecimal('0')
    result.#coefficient = a - b
    result.#scale = maxScale
    return result
  }
  multiply(other) {
    const bd = new _BigDecimal(other)
    const result = new _BigDecimal('0')
    result.#coefficient = this.#coefficient * bd.#coefficient
    result.#scale = this.#scale + bd.#scale
    return result
  }
  divide(other, precision = 20) {
    const bd = new _BigDecimal(other)
    if (bd.#coefficient === 0n) {
      throw new Error('Division by zero')
    }
    const scaleFactor = BigInt(10 ** (precision + bd.#scale - this.#scale))
    const expandedDividend = this.#coefficient * scaleFactor
    const quotient = expandedDividend / bd.#coefficient
    const result = new _BigDecimal('0')
    result.#coefficient = quotient
    result.#scale = precision
    return result
  }
  toString() {
    let str = this.#coefficient.toString()
    const isNegative = str[0] === '-'
    if (isNegative) {
      str = str.slice(1)
    }
    while (str.length <= this.#scale) {
      str = '0' + str
    }
    if (this.#scale > 0) {
      const insertPos = str.length - this.#scale
      str = str.slice(0, insertPos) + '.' + str.slice(insertPos)
      str = str.replace(/\.?0+$/, '')
    }
    return isNegative ? '-' + str : str
  }
  equals(other) {
    const bd = new _BigDecimal(other)
    const [a, b] = _BigDecimal.#alignScales(this, bd)
    return a === b
  }
  lessThan(other) {
    const bd = new _BigDecimal(other)
    const [a, b] = _BigDecimal.#alignScales(this, bd)
    return a < b
  }
  greaterThan(other) {
    const bd = new _BigDecimal(other)
    const [a, b] = _BigDecimal.#alignScales(this, bd)
    return a > b
  }
}
var DecimalExpressionParser = class {
  static #operators = {
    '+': { precedence: 1, method: 'add' },
    '-': { precedence: 1, method: 'subtract' },
    '*': { precedence: 2, method: 'multiply' },
    '/': { precedence: 2, method: 'divide' },
  }
  static #tokenize(expression) {
    expression = expression.replace(/\s+/g, '')
    const tokens = []
    let number = ''
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i]
      if (char === '.' || char === 'e' || char === 'E' || !isNaN(char)) {
        number += char
      } else if (this.#operators[char] || char === '(' || char === ')') {
        if (number) {
          tokens.push(number)
          number = ''
        }
        tokens.push(char)
      } else {
        throw new Error(`Invalid character: ${char}`)
      }
    }
    if (number) {
      tokens.push(number)
    }
    return tokens
  }
  static #toRPN(tokens) {
    const output = []
    const stack = []
    for (const token of tokens) {
      if (!isNaN(parseFloat(token))) {
        output.push(token)
      } else if (token === '(') {
        stack.push(token)
      } else if (token === ')') {
        while (stack.length && stack[stack.length - 1] !== '(') {
          output.push(stack.pop())
        }
        stack.pop()
      } else if (this.#operators[token]) {
        while (
          stack.length &&
          this.#operators[stack[stack.length - 1]] &&
          this.#operators[stack[stack.length - 1]].precedence >= this.#operators[token].precedence
        ) {
          output.push(stack.pop())
        }
        stack.push(token)
      }
    }
    while (stack.length) {
      const op = stack.pop()
      if (op === '(' || op === ')') {
        throw new Error('Mismatched parentheses')
      }
      output.push(op)
    }
    return output
  }
  static generateBigDecimalExpression(expression) {
    const tokens = this.#tokenize(expression)
    const rpn = this.#toRPN(tokens)
    const stack = []
    for (const token of rpn) {
      if (!isNaN(parseFloat(token))) {
        stack.push(`new BigDecimal('${token}')`)
      } else if (this.#operators[token]) {
        const b = stack.pop()
        const a = stack.pop()
        if (!a || !b) throw new Error('Invalid expression')
        stack.push(`${a}.${this.#operators[token].method}(${b})`)
      }
    }
    if (stack.length !== 1) {
      throw new Error('Invalid expression')
    }
    return stack[0]
  }
}
var Calculator = class {
  constructor(env) {
    console.log(`calculator translator init`)
  }
  finalizer() {
    console.log(`calculator translator finit`)
  }
  translate(input, segment, env) {
    if (!input.startsWith('/js') && !input.startsWith('/calc')) {
      return []
    }
    segment.prompt = '\u3014\u6570\u5B66\u8BA1\u7B97\u3015 /calc \u6216 /js \u89E6\u53D1'
    const express = input.replace(/^(\/calc|\/js)/, '').trim()
    if (express.length < 1) return []
    const candidates = []
    try {
      const result = calcSimpleMath(express) || calcWithOperators(express)
      const resultStr = result === null || result === void 0 || isNaN(result) ? 'null' : result.toString()
      candidates.push(new Candidate(input, segment.start, segment.end, resultStr, ''))
      candidates.push(new Candidate(input, segment.start, segment.end, `${express}=${resultStr}`, ''))
      candidates.push(new Candidate(input, segment.start, segment.end, `\`${express}=${resultStr}\``, ''))
    } catch (error) {
      candidates.push(
        new Candidate(
          input,
          segment.start,
          segment.end,
          express,
          '\u89E3\u6790\u5931\u8D25: ' + error.message,
        ),
      )
    }
    candidates.push(
      new Candidate(
        input,
        segment.start,
        segment.end,
        '\u3014\u652F\u6301\u5E38\u6570\u3015',
        'e = 2.718281828459, pi(\u03C0) = 3.1415926535898',
      ),
    )
    const hints =
      'random(\u968F\u673A\u6570), avg(\u5E73\u5747), var(\u65B9\u5DEE), fact(\u9636\u4E58)\n		abs(\u7EDD\u5BF9\u503C), ceil(\u5411\u4E0A\u53D6\u6574), floor(\u5411\u4E0B\u53D6\u6574), round(\u56DB\u820D\u4E94\u5165), sign(\u7B26\u53F7)\n		min(\u6700\u5C0F\u503C), max(\u6700\u5927\u503C), pow(\u5E42), hypot(\u6C42\u76F4\u89D2\u4E09\u89D2\u5F62\u659C\u8FB9)\n		exp(\u81EA\u7136\u5BF9\u6570), log(\u5E95\u6570\u4E3A10\u7684\u5BF9\u6570), log10(\u5E95\u6570\u4E3A10\u7684\u5BF9\u6570), log2(\u5E95\u6570\u4E3A2\u7684\u5BF9\u6570)\n		clz32(32\u4F4D\u6574\u6570\u7684\u524D\u5BFC\u96F6\u4E2A\u6570), expm1(\u6307\u6570\u51CF1), log1p(1+\u5BF9\u6570)\n		cbrt(\u7ACB\u65B9\u6839), imul(\u6574\u6570\u4E58\u6CD5), fround(\u5355\u7CBE\u5EA6\u6D6E\u70B9\u6570), trunc(\u622A\u65AD\u6574\u6570)\n		sin(\u6B63\u5F26), cos(\u4F59\u5F26), tan(\u6B63\u5207), asin(\u53CD\u6B63\u5F26), acos(\u53CD\u4F59\u5F26), atan(\u53CD\u6B63\u5207)\n		sinh(\u53CC\u66F2\u6B63\u5F26), cosh(\u53CC\u66F2\u4F59\u5F26), tanh(\u53CC\u66F2\u6B63\u5207), atan2(\u53CD\u6B63\u5207), atanh(\u53CD\u53CC\u66F2\u6B63\u5207)'
    candidates.push(
      new Candidate(input, segment.start, segment.end, '\u3014\u652F\u6301\u51FD\u6570\u3015', hints),
    )
    return candidates
  }
}
function calcSimpleMath(expression) {
  if (/^[0-9.()\+\-*/]+$/.test(expression)) {
    const exprWithBigDecimal = DecimalExpressionParser.generateBigDecimalExpression(expression)
    if (exprWithBigDecimal) {
      const calculate = new Function('BigDecimal', ` return ${exprWithBigDecimal}; `)
      return calculate(BigDecimal)
    }
  }
  return null
}
function calcWithOperators(expression) {
  const processedExpr = expression
    .replace(/([0-9]+)!/g, 'fact($1)')
    .replace(/\be\b/gi, 'operators.E')
    .replace(/\bpi\b/gi, 'operators.PI')
    .replace(new RegExp('\\b(' + Object.keys(operators).join('|') + ')\\(', 'g'), (_, p1) => {
      return `operators.${p1}(`
    })
  const calculate = new Function('operators', ` return ${processedExpr}; `)
  return calculate(operators)
}
var operators = {
  E: Math.E,
  PI: Math.PI,
  abs: (x) => Math.abs(x),
  ceil: (x) => Math.ceil(x),
  floor: (x) => Math.floor(x),
  round: (x) => Math.round(x),
  sign: (x) => Math.sign(x),
  sqrt: (x) => Math.sqrt(x),
  pow: (x, y) => Math.pow(x, y),
  sin: (x) => Math.sin(x),
  cos: (x) => Math.cos(x),
  tan: (x) => Math.tan(x),
  asin: (x) => Math.asin(x),
  acos: (x) => Math.acos(x),
  atan: (x) => Math.atan(x),
  atan2: (y, x) => Math.atan2(y, x),
  sinh: (x) => Math.sinh(x),
  cosh: (x) => Math.cosh(x),
  tanh: (x) => Math.tanh(x),
  asinh: (x) => Math.asinh(x),
  acosh: (x) => Math.acosh(x),
  atanh: (x) => Math.atanh(x),
  exp: (x) => Math.exp(x),
  log: (x) => Math.log(x),
  log10: (x) => Math.log10(x),
  log2: (x) => Math.log2(x),
  clz32: (x) => Math.clz32(x),
  expm1: (x) => Math.expm1(x),
  log1p: (x) => Math.log1p(x),
  cbrt: (x) => Math.cbrt(x),
  imul: (x, y) => Math.imul(x, y),
  fround: (x) => Math.fround(x),
  trunc: (x) => Math.trunc(x),
  min: (...args) => Math.min(...args),
  max: (...args) => Math.max(...args),
  hypot: (...args) => Math.hypot(...args),
  random: (min, max) => {
    if (!min) return Math.random()
    if (!max) return Math.floor(Math.random() * min + 1)
    return Math.floor(Math.random() * (max - min) + min)
  },
  deg: (x) => (x * 180) / Math.PI,
  rad: (x) => (x * Math.PI) / 180,
  avg: (...args) => {
    if (args.length === 0) throw new Error('\u6837\u672C\u6570\u91CF\u4E0D\u80FD\u4E3A0')
    return args.reduce((sum, val) => sum + val, 0) / args.length
  },
  var: (...args) => {
    if (args.length === 0) throw new Error('\u6837\u672C\u6570\u91CF\u4E0D\u80FD\u4E3A0')
    const mean = operators.avg(...args)
    return args.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / args.length
  },
  fact: (x) => {
    if (x < 0) throw new Error('\u9636\u4E58\u4E0D\u80FD\u4E3A\u8D1F\u6570')
    if (x === 0 || x === 1) return 1
    let result = 1
    for (let i = 1; i <= x; i++) {
      result *= i
    }
    return result
  },
}
export { Calculator }
