/**
 * Node class for Trie data structure
 */
class TrieNode {
  constructor() {
    this.children = new Map()
    this.isEndOfWord = false
    this.data = null // String data stored at end nodes
  }
}

/**
 * Trie data structure implementation
 * Efficient for prefix-based operations
 */
export class Trie {
  constructor() {
    this.root = new TrieNode()
  }

  /**
   * Insert a word into the trie with associated data
   * @param {string} word - The word to insert
   * @param {string} data - Data to store at the end node
   */
  insert(word, data) {
    let current = this.root

    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode())
      }
      current = current.children.get(char)
    }

    current.isEndOfWord = true
    current.data = data
  }

  // format: sometimes	['sʌmtaimz] adv. 有时, 时常, 往往
  parseLine(line) {
    const idx = line.indexOf('\t')
    if (idx < 1) return null

    return {
      text: line.substring(0, idx).trim().toLowerCase(),
      info: line.substring(idx + 1).trim(),
    }
  }

  // format: sometimes	['sʌmtaimz] adv. 有时, 时常, 往往
  parseLineRegex(line) {
    const matches = line.match(/^(.*?)\s+(.+)\s*$/)
    if (!matches) return null

    const [, text, info] = matches
    return {
      text: text.trim().toLowerCase(),
      info: info.trim(),
    }
  }

  /**
   * Search for a word in the trie
   * @param {string} word - The word to search for
   * @returns {Object} Object of associated data, null if not found
   */
  find(word) {
    const node = this._traverse(word)
    return node?.data || null
  }

  /**
   * Check if there are any words in the trie that start with the given prefix
   * @param {string} prefix - The prefix to search for
   * @returns {boolean} True if prefix exists
   */
  startsWith(prefix) {
    return this._traverse(prefix) !== null
  }

  /**
   * Get all words with the given prefix
   * @param {string} prefix - The prefix to search for
   * @returns {Array<Object>} Array of objects containing words and their associated data
   */
  prefixSearch(prefix) {
    const result = []
    const node = this._traverse(prefix)

    if (node !== null) {
      this._collectWords(node, prefix, result)
    }

    return result
  }

  /**
   * Helper method to traverse the trie
   * @private
   */
  _traverse(word) {
    let current = this.root

    for (const char of word) {
      if (!current.children.has(char)) {
        return null
      }
      current = current.children.get(char)
    }

    return current
  }

  /**
   * Helper method to collect all words with a given prefix
   * @private
   */
  _collectWords(node, prefix, result) {
    if (node.isEndOfWord) {
      result.push({
        text: prefix,
        info: node.data,
      })
    }

    for (const [char, childNode] of node.children) {
      this._collectWords(childNode, prefix + char, result)
    }
  }
}
