-- Define the TrieNode class
TrieNode = {}
TrieNode.__index = TrieNode

function TrieNode.new()
    return setmetatable({children = {}, isEndOfWord = false, data = nil}, TrieNode)
end

-- Define the Trie class
Trie = {}
Trie.__index = Trie

-- @theKeyUnit is the number of characters in a key unit
function Trie.new(theKeyUnit)
    local keyUnit = tonumber(theKeyUnit) or 1
    return setmetatable({root = TrieNode.new(), keyUnit = keyUnit}, Trie)
end

-- Insert a word into the Trie with associated data
function Trie:insert(word, data)
    local currentNode = self.root
    local keyUnit = self.keyUnit
    for i = 0, #word / keyUnit do
        local char = word:sub(i * keyUnit + 1, (i + 1) * keyUnit)
        if not currentNode.children[char] then
            currentNode.children[char] = TrieNode.new()
        end
        currentNode = currentNode.children[char]
    end
    currentNode.isEndOfWord = true
    currentNode.data = data
end

-- Search for a word in the Trie and return its associated data
function Trie:search(word)
    local currentNode = self.root
    for i = 0, #word / self.keyUnit do
        local char = word:sub(i * self.keyUnit + 1, (i + 1) * self.keyUnit)
        if not currentNode.children[char] then
            return nil
        end
        currentNode = currentNode.children[char]
    end
    if currentNode.isEndOfWord then
        return currentNode.data
    else
        return nil
    end
end

return Trie
