export class BigDecimal {
  // Store as BigInt with a fixed scale (number of decimal places)
  // value = coefficient * 10^(-scale)
  #coefficient // BigInt internal value
  #scale // Number of decimal places

  constructor(value) {
    if (value instanceof BigDecimal) {
      this.#coefficient = value.#coefficient
      this.#scale = value.#scale
      return
    }

    let str = String(value).trim()
    this.#scale = 0

    // Handle decimal point
    const decimalPos = str.indexOf('.')
    if (decimalPos !== -1) {
      this.#scale = str.length - decimalPos - 1
      str = str.replace('.', '')
    }

    // Handle scientific notation
    const ePos = str.toLowerCase().indexOf('e')
    if (ePos !== -1) {
      const exp = parseInt(str.slice(ePos + 1))
      str = str.slice(0, ePos)
      this.#scale -= exp
    }

    this.#coefficient = BigInt(str)
  }

  // Helper method to align scales of two BigDecimals
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

  // Addition
  add(other) {
    const bd = new BigDecimal(other)
    const maxScale = Math.max(this.#scale, bd.#scale)
    const [a, b] = BigDecimal.#alignScales(this, bd)
    const result = new BigDecimal('0')
    result.#coefficient = a + b
    result.#scale = maxScale
    return result
  }

  // Subtraction
  subtract(other) {
    const bd = new BigDecimal(other)
    const maxScale = Math.max(this.#scale, bd.#scale)
    const [a, b] = BigDecimal.#alignScales(this, bd)
    const result = new BigDecimal('0')
    result.#coefficient = a - b
    result.#scale = maxScale
    return result
  }

  // Multiplication
  multiply(other) {
    const bd = new BigDecimal(other)
    const result = new BigDecimal('0')
    result.#coefficient = this.#coefficient * bd.#coefficient
    result.#scale = this.#scale + bd.#scale
    return result
  }

  // Division
  divide(other, precision = 20) {
    const bd = new BigDecimal(other)
    if (bd.#coefficient === 0n) {
      throw new Error('Division by zero')
    }

    const scale = this.#scale - bd.#scale
    const scaleFactor = BigInt(10 ** precision)

    // Perform division with extra precision to minimize rounding errors
    const expandedDividend = this.#coefficient * scaleFactor
    const quotient = expandedDividend / bd.#coefficient

    const result = new BigDecimal('0')
    result.#coefficient = quotient
    result.#scale = precision
    return result
  }

  // Convert to string with proper decimal point placement
  toString() {
    let str = this.#coefficient.toString()

    // Handle negative numbers
    const isNegative = str[0] === '-'
    if (isNegative) {
      str = str.slice(1)
    }

    // Add leading zeros if needed
    while (str.length <= this.#scale) {
      str = '0' + str
    }

    if (this.#scale > 0) {
      const insertPos = str.length - this.#scale
      str = str.slice(0, insertPos) + '.' + str.slice(insertPos)

      // Remove trailing zeros after decimal point
      str = str.replace(/\.?0+$/, '')
    }

    return isNegative ? '-' + str : str
  }

  // Comparison methods
  equals(other) {
    const bd = new BigDecimal(other)
    const [a, b] = BigDecimal.#alignScales(this, bd)
    return a === b
  }

  lessThan(other) {
    const bd = new BigDecimal(other)
    const [a, b] = BigDecimal.#alignScales(this, bd)
    return a < b
  }

  greaterThan(other) {
    const bd = new BigDecimal(other)
    const [a, b] = BigDecimal.#alignScales(this, bd)
    return a > b
  }
}

export class DecimalExpressionParser {
  static #operators = {
    '+': { precedence: 1, method: 'add' },
    '-': { precedence: 1, method: 'subtract' },
    '*': { precedence: 2, method: 'multiply' },
    '/': { precedence: 2, method: 'divide' },
  }

  // 将表达式字符串转换为标记数组
  static #tokenize(expression) {
    // 移除所有空白字符
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

  // 将中缀表达式转换为后缀表达式（逆波兰表示法）
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
        stack.pop() // 移除左括号
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

  // 生成 BigDecimal 表达式
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
