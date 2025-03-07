// Type definitions for Rime QJS API
// Project: Rime QJS Plugin
// -----------------------------------
// Extracted by DeepSeek-Reasoner (R1), and manually edited by @[HuangJian](https://github.com/HuangJian)

/**
 * Represents a keyboard input event
 * @namespace KeyEvent
 */
interface KeyEvent {
  /**
   * Whether Shift modifier is active
   * @readonly
   */
  readonly shift: boolean

  /**
   * Whether Control modifier is active
   * @readonly
   */
  readonly ctrl: boolean

  /**
   * Whether Alt/Option modifier is active
   * @readonly
   */
  readonly alt: boolean

  /**
   * True if this is a key release event
   * @readonly
   */
  readonly release: boolean

  /**
   * String representation of the key event (e.g. 'Return')
   * @readonly
   */
  readonly repr: string
}

/**
 * Represents composition state during input
 * @namespace Preedit
 */
interface Preedit {
  /**
   * Current composition text
   * @returns {string} Composed text
   */
  text: string

  /**
   * Current caret position within the preedit
   * @returns {number} Caret index position
   */
  caretPos: number

  /**
   * Selection start index in the preedit
   * @readonly
   */
  selectStart: number

  /**
   * Selection end index in the preedit
   * @readonly
   */
  selectEnd: number
}

/**
 * Represents a segment of the composition
 * @namespace Segment
 */
interface Segment {
  /**
   * Index of currently selected candidate
   * @returns {number} Current selection index
   */
  selectedIndex: number

  /**
   * Prompt text displayed before candidates
   * @returns {string} Prompt message
   */
  prompt: string

  /**
   * Start position in the input sequence
   * @readonly
   */
  readonly start: number

  /**
   * End position in the input sequence
   * @readonly
   */
  readonly end: number

  /** Currently selected candidate */
  readonly selectedCandidate: Candidate
  /** Number of candidates in this segment */
  readonly candidateSize: number

  /**
   * Get candidate at specified index
   * @param index - Zero-based candidate index
   * @returns Candidate object or null if index is out of bounds
   */
  getCandidateAt(index: number): Candidate | null

  /**
   * Check if segment contains specific tag
   * @param tag - Tag to check for
   * @returns True if segment has the specified tag
   */
  hasTag(tag: string): boolean
}

/**
 * Manages input context and composition state
 * @namespace Context
 */
interface Context {
  /**
   * Current raw input string
   * @returns {string} Unprocessed input
   */
  input: string

  /**
   * Current caret position in the input
   * @returns {number} Caret index position
   */
  caretPos: number

  /** Current composition state */
  readonly preedit: Preedit
  /** Last segment in current composition (null if empty) */
  readonly lastSegment: Segment | null

  /** Commit current composition */
  commit(): void

  /**
   * Get text that would be committed
   * @returns Currently composed text
   */
  getCommitText(): string

  /** Clear input and composition state */
  clear(): void

  /**
   * Check if candidate menu is available
   * @returns True if menu has candidates
   */
  hasMenu(): boolean

  /**
   * Check if in composition state
   * @returns True if composing
   */
  isComposing(): boolean
}

/**
 * Represents an input schema configuration
 * @namespace Schema
 */
interface Schema {
  /**
   * Unique schema identifier string
   * @readonly
   */
  readonly id: string

  /**
   * Display name of the schema
   * @readonly
   */
  readonly name: string

  /**
   * Configuration object containing schema settings
   * @readonly
   */
  readonly config: Config

  /**
   * Number of candidates shown per page
   * @readonly
   */
  readonly pageSize: number

  /**
   * Key sequence used for candidate selection
   * @readonly
   */
  readonly selectKeys: string
}

/**
 * Core input method engine
 * @namespace Engine
 */
interface Engine {
  /**
   * Currently active schema
   * @readonly
   */
  readonly schema: Schema

  /**
   * Input context
   * @readonly
   */
  readonly context: Context

  /** Reference to parent engine (null for root engine) */
  readonly activeEngine: Engine | null

  /**
   * Process a key event
   * @param keyEvent - String representation of key event (e.g. 'Down')
   * @returns True if the key was processed, false if ignored
   */
  processKey(keyEvent: string): boolean

  /**
   * Commit text directly to output
   * @param text - Text to commit
   */
  commitText(text: string): void

  /**
   * Switch to a different schema
   * @param schema - Target schema to activate
   * @returns True if schema switch was successful
   */
  applySchema(schema: Schema): boolean
}

/**
 * Represents a configuration value with type-specific accessors
 * @namespace ConfigValue
 */
interface ConfigValue {
  /**
   * Get the value type (always returns 'scalar')
   * @returns {'scalar'} Type identifier
   */
  getType(): 'scalar'

  /**
   * Retrieve boolean value from configuration
   * @returns {boolean | null} Configured value or null if not found
   */
  getBool(): boolean | null

  /**
   * Retrieve integer value from configuration
   * @returns {number | null} Configured value or null if not found
   */
  getInt(): number | null

  /**
   * Retrieve floating-point value from configuration
   * @returns {number | null} Configured value or null if not found
   */
  getDouble(): number | null

  /**
   * Retrieve string value from configuration
   * @returns {string | null} Configured value or null if not found
   */
  getString(): string | null
}

/**
 * Represents a configuration item that can hold different value types
 * @namespace ConfigItem
 */
interface ConfigItem {
  /**
   * Get the value type (always returns 'item')
   * @returns {'item'} Type identifier
   */
  getType(): 'item'
}

/**
 * Represents a configuration list structure
 * @namespace ConfigList
 */
interface ConfigList {
  /**
   * Get the container type (always returns 'list')
   * @returns {'list'} Type identifier
   */
  getType(): 'list'

  /**
   * Get number of items in the list
   * @returns {number} List size
   */
  getSize(): number

  /**
   * Get configuration item at specified index
   * @param index - Zero-based index position
   * @returns {ConfigItem | null} Item or null if index out of bounds
   */
  getItemAt(index: number): ConfigItem | null

  /**
   * Get configuration value at specified index
   * @param index - Zero-based index position
   * @returns {ConfigValue | null} Value or null if index out of bounds
   */
  getValueAt(index: number): ConfigValue | null

  /**
   * Append new item to the end of the list
   * @param item - Configuration item to add
   */
  pushBack(item: ConfigItem): void

  /** Clear all items from the list */
  clear(): void
}

/**
 * Represents a configuration map/dictionary structure
 * @namespace ConfigMap
 */
interface ConfigMap {
  /**
   * Get the container type (always returns 'map')
   * @returns {'map'} Type identifier
   */
  getType(): 'map'

  /**
   * Check if map contains a specific key
   * @param key - Key to check for existence
   * @returns {boolean} True if key exists in the map
   */
  hasKey(key: string): boolean

  /**
   * Get configuration item by key
   * @param key - Map key to lookup
   * @returns {ConfigItem | null} Associated item or null if not found
   */
  getItem(key: string): ConfigItem | null

  /**
   * Get configuration value by key
   * @param key - Map key to lookup
   * @returns {ConfigValue | null} Associated value or null if not found
   */
  getValue(key: string): ConfigValue | null

  /**
   * Set/update a key-value pair in the map
   * @param key - Map key to set
   * @param item - Configuration item to associate with the key
   */
  setItem(key: string, item: ConfigItem): void
}

/**
 * Root configuration container with file operations
 * @namespace Config
 */
interface Config {
  /**
   * Load configuration from file
   * @param filePath - Path to configuration file
   * @returns {boolean} True if load succeeded
   */
  loadFromFile(filePath: string): boolean

  /**
   * Save configuration to file
   * @param filePath - Destination file path
   * @returns {boolean} True if save succeeded
   */
  saveToFile(filePath: string): boolean

  /**
   * Get boolean value by path
   * @param path - Configuration path (e.g. 'menu/page_size')
   * @returns {boolean | null} Configured value or null if not found
   */
  getBool(path: string): boolean | null

  /**
   * Get integer value by path
   * @param path - Configuration path
   * @returns {number | null} Configured value or null if not found
   */
  getInt(path: string): number | null

  /**
   * Get double value by path
   * @param path - Configuration path
   * @returns {number | null} Configured value or null if not found
   */
  getDouble(path: string): number | null

  /**
   * Get string value by path
   * @param path - Configuration path
   * @returns {string | null} Configured value or null if not found
   */
  getString(path: string): string | null

  /**
   * Get configuration list by path
   * @param path - Configuration path
   * @returns {ConfigList | null} List container or null if not found
   */
  getList(path: string): ConfigList | null

  /**
   * Set boolean value by path
   * @param path - Configuration path
   * @param value - New value to set
   * @returns {boolean} True if update succeeded
   */
  setBool(path: string, value: boolean): boolean

  /**
   * Set integer value by path
   * @param path - Configuration path
   * @param value - New value to set
   * @returns {boolean} True if update succeeded
   */
  setInt(path: string, value: number): boolean

  /**
   * Set double value by path
   * @param path - Configuration path
   * @param value - New value to set
   * @returns {boolean} True if update succeeded
   */
  setDouble(path: string, value: number): boolean

  /**
   * Set string value by path
   * @param path - Configuration path
   * @param value - New value to set
   * @returns {boolean} True if update succeeded
   */
  setString(path: string, value: string): boolean
}

/**
 * Represents a candidate in the selection menu
 * @namespace Candidate
 */
/**
 * Represents a candidate entry in the selection menu
 * @namespace Candidate
 */
interface Candidate {
  /**
   * Create a new Candidate instance
   * @param type - Candidate type identifier (e.g. 'pinyin', 'stroke')
   * @param start - Start position in input sequence (zero-based index)
   * @param end - End position in input sequence (zero-based index)
   * @param text - Display text for the candidate
   * @param comment - Annotation/comment text (often pronunciation)
   * @param quality - Optional quality score (higher = better match)
   */
  new (type: string, start: number, end: number, text: string, comment: string, quality?: number): Candidate

  /** The displayed candidate text */
  text: string
  /** Phonetic annotation or explanatory comment */
  comment: string
  /** Candidate type identifier */
  type: string
  /** Start index in input sequence */
  start: number
  /** End index in input sequence */
  end: number
  /** Match quality score (0-100) */
  quality: number
  /** The input text?  `engine.context.input` is preferred. */
  preedit?: string
}

/**
 * Represents a dictionary trie data structure, to store the dictionary data (in key-value pairs)
 */
interface Trie {
  /**
   * Creates a new instance of Trie
   */
  new (): Trie

  /**
   * Loads a trie from a text file
   * @param path - The path to the text file containing trie data
   * @param entrySize - The entry size (lines) of the text file
   * @throws {Error} If the file cannot be read or the format is invalid
   */
  loadTextFile(path: string, entrySize?: number): void

  /**
   * Loads a trie from a binary file
   * @param path - The path to the binary file containing trie data
   * @throws {Error} If the file cannot be read or the format is invalid
   */
  loadBinaryFile(path: string): void

  /**
   * Saves the current trie to a binary file
   * @param path - The path where the binary file will be saved
   * @throws {Error} If the file cannot be written
   */
  saveToBinaryFile(path: string): void

  /**
   * Searches for an exact match of the key in the trie
   * @param key - The string to search for
   * @returns the value if the key exists in the trie, null otherwise
   */
  find(key: string): string

  /**
   * Searches for all key-value pairs in the trie that the key starts with the given prefix
   * @param prefix - The prefix to search for
   * @returns An array of objects that the key starts with the given prefix
   */
  prefixSearch(prefix: string): Array<{ text: string; info: string }>
}

/**
 * Represents the JavaScript runtime environment for Rime
 * @namespace Environment
 */
interface Environment {
  /**
   * Reference to the Rime engine instance
   * @readonly
   */
  readonly engine: Engine

  /**
   * Current namespace identifier
   * @readonly
   */
  readonly namespace: string

  /**
   * Path to user data directory
   * @readonly
   */
  readonly userDataDir: string

  /**
   * Load content from a file
   * @param absolutePath - Full path to the file to load
   * @returns {string} File contents as string
   * @throws {Error} If file cannot be read or path is invalid
   */
  loadFile(absolutePath: string): string

  /**
   * Check if a file exists
   * @param absolutePath - Full path to check
   * @returns {boolean} True if file exists
   */
  fileExists(absolutePath: string): boolean

  /**
   * Get Rime version and memory usage information
   * @returns {string} Formatted string with version and memory stats
   */
  getRimeInfo(): string

  /**
   * Execute a shell command and capture its output
   * @param command - Shell command to execute
   * @returns {string} Command output
   * @throws {Error} If command execution fails
   */
  popen(command: string): string
}

/**
 * Interface for JavaScript module lifecycle in Rime
 * @namespace Module
 */
interface Module {
  /**
   * Initialization function called when module is loaded
   * @param env - The runtime environment
   * @returns {void}
   */
  init?(env: Environment): void

  /**
   * Cleanup function called when module is unloaded
   * @param env - The runtime environment
   * @returns {void}
   */
  finit?(env: Environment): void
}

/**
 * Return values for key event processing
 * @remarks
 * - 'kRejected': do the OS default processing
 * - 'kAccepted': consume it
 * - 'kNoop': leave it to other processors
 */
type ProcessResult = 'kRejected' | 'kAccepted' | 'kNoop'

/**
 * Represents a Rime input processor
 * @namespace Processor
 */
interface Processor extends Module {
  /**
   * Process a keyboard input event
   * @param keyEvent - The key event to process
   * @param env - The runtime environment
   * @returns {ProcessResult} 0 for rejected, 1 for accepted, 2 for noop
   */
  process(keyEvent: KeyEvent, env: Environment): ProcessResult
}

/**
 * Represents a Rime translator module for converting input to candidates
 * @namespace Translator
 */
interface Translator extends Module {
  /**
   * Query for candidates matching the input
   * @param input - The input string to translate
   * @param segment - The current segment being translated
   * @param env - The runtime environment
   * @returns {Array<Candidate>} Array of matching candidates
   */
  query(input: string, segment: Segment, env: Environment): Array<Candidate>
}

/**
 * Represents a Rime filter module for processing candidates
 * @namespace Filter
 */
interface Filter extends Module {
  /**
   * Apply filtering to a list of candidates
   * @param candidates - Array of candidates to filter
   * @param env - The runtime environment
   * @returns {Array<Candidate>} Filtered array of candidates
   */
  apply(candidates: Array<Candidate>, env: Environment): Array<Candidate>
}
