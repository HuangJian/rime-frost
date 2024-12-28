---@diagnostic disable: need-check-nil
local cn2en = require("../en2cn")
local luaunit = require("luaunit")

TestEn2cnPfm = {}

local function checkWordsWith2LevelTable(dict)
    local testWords = { "pleasant", "october", "cold", "always", "zero", "sometimes" }
    for _, word in ipairs(testWords) do
        local data = dict[word:sub(1, 1):lower()][word]
        luaunit.assertNotNil(data)
    end
end

local function checkWordsWithTableDict(dict)
    local testWords = { "pleasant", "october", "cold", "always", "zero", "sometimes" }
    for _, word in ipairs(testWords) do
        local data = dict[word]
        luaunit.assertNotNil(data)
    end
end

local function openDataFile()
    local fileAbsolutePath = "./data/ecdict.txt"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then
        print("File not found: " .. fileAbsolutePath)
        return nil
    end
    return file
end

local function loadDataTo2LevelTable()
    local dict = {}
    local alphabet = 'abcdefghijklmnopqrstuvwxyz'
    for i = 1, alphabet:len(), 1 do
        dict[alphabet:sub(i, i)] = {}
    end

    local file = openDataFile()

    local startTime = os.clock()
    for line in file:lines() do
        local w = cn2en.parseLine(line)
        if w then
            local firstChar = w.word:sub(1, 1)
            if dict[firstChar] then
                dict[firstChar][w.word] = w.info
            else
                print("dict[".. firstChar .."] is nil")
            end
        end
    end
    file:close()
    local parseTime = os.clock()

    checkWordsWith2LevelTable(dict)
    local searchTime = os.clock()

    collectgarbage("collect")
    return {
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
        memory = collectgarbage("count") / 1024 .. "MB",
        parseTime = (parseTime - startTime) .. "S",
        searchTime = (searchTime - parseTime) * 1000 .. "MS",
    }
end

function TestEn2cnPfm.testLoadDataPerformance()
    print("==== performance of loading en2cn data ====")

    local tablePfm = loadDataToTable()
    print("Table: memory = " .. tablePfm.memory ..
        ", parseTime = " .. tablePfm.parseTime .. " and searchTime = " .. tablePfm.searchTime)

    local twoLevelTablePfm = loadDataTo2LevelTable()
    print("2L Table: memory = " .. twoLevelTablePfm.memory ..
        ", parseTime = " .. twoLevelTablePfm.parseTime .. " and searchTime = " .. twoLevelTablePfm.searchTime)
end

os.exit(luaunit.LuaUnit.run())

-- ==== performance of loading en2cn data ====
-- Table: memory = 8.8966379165649MB, parseTime = 0.171753S and searchTime = 0.006000000000006MS
-- 2L Table: memory = 9.2695398330688MB, parseTime = 0.164476S and searchTime = 0.011999999999956MS
