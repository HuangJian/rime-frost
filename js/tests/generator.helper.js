/**
 * @param {any[]} array
 */
export function makeIterator(array) {
  let cursor = 0
  return {
    next() {
      return array[cursor++]
    },
  }
}

export function getGeneratorYieldValues(generator) {
  if (!generator || typeof generator.next !== 'function') {
    return []
  }

  const ret = []
  let iterator
  while (true) {
    const result = generator.next()
    if (result.done) {
      iterator = result.value
      break
    }
    ret.push(result.value)
  }
  while (true) {
    const result = iterator?.next()
    if (!result) {
      break
    }
    ret.push(result)
  }
  return ret
}
