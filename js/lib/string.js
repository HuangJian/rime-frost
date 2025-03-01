
const accents = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'
const without = 'aaaaeeeeiiiioooouuuuvvvvv'
const dict = {}
accents.split('').forEach((char, idx) => (dict[char] = without[idx]))

export function unaccent(str) {
  return str
    .split('')
    .map((char) => {
      return dict[char] || char
    })
    .join('')
}

export function isChineseWord(word) {
  // Check for at least one Chinese character (range U+4E00 to U+9FFF)
  return /[\u4e00-\u9fff]/.test(word)
}
