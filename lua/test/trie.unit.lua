---@diagnostic disable: need-check-nil
local Trie = require("../lib/trie")
local luaunit = require("luaunit")

Cn2enPfm = {}

function Cn2enPfm:testInsertAndSearch()
    local trie = Trie:new(1)
    trie:insert("测试", {word = "测试", phonics = "cè shì", info = "test"})
    trie:insert("数学", {word = "数学", phonics = "shù xué", info = "mathematics"})

    local result1 = trie:search("测试")
    luaunit.assertNotNil(result1)
    luaunit.assertEquals(result1.word, "测试")
    luaunit.assertEquals(result1.phonics, "cè shì")
    luaunit.assertEquals(result1.info, "test")

    local result2 = trie:search("数学")
    luaunit.assertNotNil(result2)
    luaunit.assertEquals(result2.word, "数学")
    luaunit.assertEquals(result2.phonics, "shù xué")
    luaunit.assertEquals(result2.info, "mathematics")

    local result3 = trie:search("不存在")
    luaunit.assertNil(result3)

    local result4 = trie:search("数")
    luaunit.assertNil(result4)

    local result5 = trie:search("数字")
    luaunit.assertNil(result5)

    local result6 = trie:search("数学家")
    luaunit.assertNil(result6)
end

function Cn2enPfm:testInsertWithDifferentKeyUnit()
    local trie = Trie:new(3)
    trie:insert("测试", {word = "测试", phonics = "cè shì", info = "test"})
    trie:insert("数学", {word = "数学", phonics = "shù xué", info = "mathematics"})

    local result1 = trie:search("测试")
    luaunit.assertNotNil(result1)
    luaunit.assertEquals(result1.word, "测试")
    luaunit.assertEquals(result1.phonics, "cè shì")
    luaunit.assertEquals(result1.info, "test")

    local result2 = trie:search("数学")
    luaunit.assertNotNil(result2)
    luaunit.assertEquals(result2.word, "数学")
    luaunit.assertEquals(result2.phonics, "shù xué")
    luaunit.assertEquals(result2.info, "mathematics")

    local result3 = trie:search("不存在")
    luaunit.assertNil(result3)

    local result4 = trie:search("数")
    luaunit.assertNil(result4)

    local result5 = trie:search("数字")
    luaunit.assertNil(result5)

    local result6 = trie:search("数学家")
    luaunit.assertNil(result6)
end

os.exit(luaunit.LuaUnit.run())
