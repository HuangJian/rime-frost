---@diagnostic disable: need-check-nil
local Trie = require("../lib/trie")
local cn2en = require("../cn_2en_pinyin")
local luaunit = require("luaunit")

TestCn2enPfm = {}

local function checkWordsWithTrie(trie)
    local testWords = { "不可数集", "数学", "测试", "算法", "不可数名词", "不在其位不谋其政" }
    for _, word in ipairs(testWords) do
        local data = trie:search(word)
        luaunit.assertNotNil(data)
    end
end

local function checkWordsWithTableDict(dict)
    local testWords = { "不可数集", "数学", "测试", "算法", "不可数名词", "不在其位不谋其政" }
    for _, word in ipairs(testWords) do
        local data = dict[word]
        luaunit.assertNotNil(data)
    end
end

local function openDataFile()
    local fileAbsolutePath = "./data/cedict_fixed.u8"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then
        print("File not found: " .. fileAbsolutePath)
        return nil
    end
    return file
end

local function loadDataToTrie(keyUnit)
    local trie = Trie:new(keyUnit)
    local file = openDataFile()

    local startTime = os.clock()
    for line in file:lines() do
        local w = cn2en.parseLine(line)
        if w then
            trie:insert(w.word, w.info)
        end
    end
    file:close()
    local parseTime = os.clock()

    checkWordsWithTrie(trie)
    local searchTime = os.clock()

    collectgarbage("collect")
    return {
        keyUnit = keyUnit,
        memory = collectgarbage("count") / 1024 .. "MB",
        parseTime = (parseTime - startTime) .. "S",
        searchTime = (searchTime - parseTime) * 1000 .. "MS",
    }
end

local function loadDataToTable()
    local dict = {}
    local file = openDataFile()

    local startTime = os.clock()
    for line in file:lines() do
        local w = cn2en.parseLine(line)
        if w then
            dict[w.word] = w.info
        end
    end
    file:close()
    local parseTime = os.clock()

    checkWordsWithTableDict(dict)
    local searchTime = os.clock()

    collectgarbage("collect")
    return {
        keyUnit = 0,
        memory = collectgarbage("count") / 1024 .. "MB",
        parseTime = (parseTime - startTime) .. "S",
        searchTime = (searchTime - parseTime) * 1000 .. "MS",
    }
end

function TestCn2enPfm.testDifferentKeyUnitPerformance()
    print("==== performance of loading cn2en data ====")

    local tablePfm = loadDataToTable()
    print("keyUnit = " .. tablePfm.keyUnit .. ", memory = " .. tablePfm.memory ..
        ", parseTime = " .. tablePfm.parseTime .. " and searchTime = " .. tablePfm.searchTime)

    for unit = 1, 6 do
        local triePfm = loadDataToTrie(unit)
        print("keyUnit = " .. triePfm.keyUnit .. ", memory = " .. triePfm.memory ..
            ", parseTime = " .. triePfm.parseTime .. " and searchTime = " .. triePfm.searchTime)
    end
end

os.exit(luaunit.LuaUnit.run())

-- ==== performance of loading cn2en data ====
-- keyUnit = 0, memory = 17.773273468018MB, parseTime = 0.668453S and searchTime = 0.008000000000008MS
-- keyUnit = 1, memory = 126.10411739349MB, parseTime = 1.555516S and searchTime = 0.037000000000287MS
-- keyUnit = 2, memory = 126.10417842865MB, parseTime = 1.592052S and searchTime = 0.035000000000451MS
-- keyUnit = 3, memory = 126.10422420502MB, parseTime = 1.363563S and searchTime = 0.034999999999563MS
-- keyUnit = 4, memory = 126.10417842865MB, parseTime = 1.873301S and searchTime = 0.042000000000542MS
-- keyUnit = 5, memory = 126.10422420502MB, parseTime = 1.375103S and searchTime = 0.030000000000641MS
-- keyUnit = 6, memory = 126.10417842865MB, parseTime = 2.036708S and searchTime = 0.03900000000101MS
