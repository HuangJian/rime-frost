---@diagnostic disable: need-check-nil
local cn2en = require("../en2cn")
local luaunit = require("luaunit")

TestEn2cnPfm = {}

local prefixSize = 2
local searchKeyword = "invi"
local expectedCount = 21

local testWords = { "a", "an", "ant", "test", "pleasant", "october", "cold",
"always", "zero", "sometimes", "invidious", "invitation" }

local function checkWordsWith2LevelTable(dict)
    for _, word in ipairs(testWords) do
        local data = dict[word:sub(1, prefixSize):lower()][word:sub(prefixSize + 1)]
        luaunit.assertNotNil(data)
    end
end

local function checkWordsWithTableDict(dict)
    for _, word in ipairs(testWords) do
        local data = dict[word]
        luaunit.assertNotNil(data)
    end
end


local function searchByPrefixWithTableDict(dict)
    local count = 0
    for key, value in pairs(dict) do
        if key:sub(1, #searchKeyword) == searchKeyword then
            -- print('found: ' .. key .. ', value = ' .. value)
            count = count + 1
        end
    end
    luaunit.assertEquals(count, expectedCount)
end

local function searchByPrefixWith2LevelTableDict(dict)
    local count = 0
    if #searchKeyword > prefixSize then
        local secondLevelDict = dict[searchKeyword:sub(1, prefixSize)]
        local secondLevelPrefix = searchKeyword:sub(prefixSize + 1)
        for key, value in pairs(secondLevelDict) do
            if key:sub(1, #secondLevelPrefix) == secondLevelPrefix then
                -- print('found: ' .. key .. ', value = ' .. value)
                count = count + 1
            end
        end
    else
        for key, value in pairs(dict) do
            if key:sub(1, #searchKeyword) == searchKeyword then
                for _, _ in pairs(value) do
                    count = count + 1
                end
            end
        end
    end

    luaunit.assertEquals(count, expectedCount)
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
    local file = openDataFile()

    local startTime = os.clock()
    for line in file:lines() do
        local w = cn2en.parseLine(line)
        if w then
            local key = w.word:sub(1, prefixSize)
            dict[key] = dict[key] or {}
            dict[key][w.word:sub(prefixSize + 1)] = w.info
        end
    end
    file:close()
    local parseTime = os.clock()

    checkWordsWith2LevelTable(dict)
    local checkTime = os.clock()

    searchByPrefixWith2LevelTableDict(dict)
    local searchTime = os.clock()

    collectgarbage("collect")
    return {
        memory = collectgarbage("count") / 1024 .. "MB",
        parseTime = (parseTime - startTime) .. "S",
        checkTime = (checkTime - parseTime) * 1000 .. "MS",
        searchTime = (searchTime - checkTime) * 1000 .. "MS",
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
    local checkTime = os.clock()


    searchByPrefixWithTableDict(dict)
    local searchTime = os.clock()

    collectgarbage("collect")
    return {
        memory = collectgarbage("count") / 1024 .. "MB",
        parseTime = (parseTime - startTime) .. "S",
        checkTime = (checkTime - parseTime) * 1000 .. "MS",
        searchTime = (searchTime - checkTime) * 1000 .. "MS",
    }
end

local testData = {
    [1] = { keyword = 'ant', count = 152},
    [2] = { keyword = 'work', count = 41},
    [3] = { keyword = 'incom', count = 24},
    [4] = { keyword = 'social', count = 15},
}

function TestEn2cnPfm.testLoadDataPerformance()
    local data = testData[2]
    searchKeyword = data.keyword
    expectedCount = data.count

    print("==== performance of loading en2cn data ====")
    print("searchKeyword = " .. searchKeyword)

    local tablePfm = loadDataToTable()
    print("Table: \t\t\tmemory = " .. tablePfm.memory ..
        ", parseTime = " .. tablePfm.parseTime ..
        ", checkTime = " .. tablePfm.checkTime .. " and searchTime = " .. tablePfm.searchTime)

    for i = 1, 8 do
        prefixSize = i
        local twoLevelTablePfm = loadDataTo2LevelTable()
        print("prefixSize = " .. prefixSize .. ": \tmemory = " .. twoLevelTablePfm.memory ..
            ", parseTime = " .. twoLevelTablePfm.parseTime ..
            ", checkTime = " .. twoLevelTablePfm.checkTime .. " and searchTime = " .. twoLevelTablePfm.searchTime)
    end
end

os.exit(luaunit.LuaUnit.run())

-- ==== performance of loading en2cn data ====
-- searchKeyword = ant
-- Table:                  memory = 8.8992023468018MB, parseTime = 0.175451S, checkTime = 0.009000000000009MS and searchTime = 15.013MS
-- prefixSize = 1:         memory = 9.0031824111938MB, parseTime = 0.177540S, checkTime = 0.014000000000014MS and searchTime = 1.05MS
-- prefixSize = 2:         memory = 8.7877130508423MB, parseTime = 0.209361S, checkTime = 0.014000000000070MS and searchTime = 0.13999999999992MS
-- prefixSize = 3:         memory = 8.7062005996704MB, parseTime = 0.227447S, checkTime = 0.015999999999905MS and searchTime = 0.94700000000003MS
-- prefixSize = 4:         memory = 9.3562068939209MB, parseTime = 0.244309S, checkTime = 0.016000000000016MS and searchTime = 4.2530000000001MS
-- prefixSize = 5:         memory = 10.468064308167MB, parseTime = 0.229174S, checkTime = 0.016000000000016MS and searchTime = 8.3330000000001MS
-- prefixSize = 6:         memory = 11.862127304077MB, parseTime = 0.242078S, checkTime = 0.015000000000098MS and searchTime = 11.529MS
-- prefixSize = 7:         memory = 12.316184997559MB, parseTime = 0.254109S, checkTime = 0.021000000000271MS and searchTime = 13.403MS
-- prefixSize = 8:         memory = 12.647969245911MB, parseTime = 0.302697S, checkTime = 0.014999999999876MS and searchTime = 13.767MS

-- searchKeyword = work
-- Table:                  memory = 8.8992023468018MB, parseTime = 0.176164S, checkTime = 0.009999999999982MS and searchTime = 18.687MS
-- prefixSize = 1:         memory = 9.0032110214233MB, parseTime = 0.181533S, checkTime = 0.014999999999987MS and searchTime = 0.32000000000004MS
-- prefixSize = 2:         memory = 8.7877140045166MB, parseTime = 0.212293S, checkTime = 0.016000000000016MS and searchTime = 0.044999999999962MS
-- prefixSize = 3:         memory = 8.7062015533447MB, parseTime = 0.215385S, checkTime = 0.013999999999958MS and searchTime = 0.021000000000049MS
-- prefixSize = 4:         memory = 9.3562078475952MB, parseTime = 0.235060S, checkTime = 0.015000000000098MS and searchTime = 3.8020000000001MS
-- prefixSize = 5:         memory = 10.468065261841MB, parseTime = 0.229498S, checkTime = 0.013999999999958MS and searchTime = 9.4799999999999MS
-- prefixSize = 6:         memory = 11.862128257751MB, parseTime = 0.254754S, checkTime = 0.014999999999876MS and searchTime = 13.385MS
-- prefixSize = 7:         memory = 12.316185951233MB, parseTime = 0.262585S, checkTime = 0.016000000000016MS and searchTime = 15.158MS
-- prefixSize = 8:         memory = 12.647970199585MB, parseTime = 0.313846S, checkTime = 0.014000000000181MS and searchTime = 15.111MS

-- searchKeyword = incom
-- Table:                  memory = 8.8992309570312MB, parseTime = 0.178800S, checkTime = 0.008000000000008MS and searchTime = 20.28MS
-- prefixSize = 1:         memory = 9.0032081604004MB, parseTime = 0.193307S, checkTime = 0.014999999999987MS and searchTime = 0.73400000000001MS
-- prefixSize = 2:         memory = 8.7877388000488MB, parseTime = 0.219586S, checkTime = 0.016000000000016MS and searchTime = 0.41999999999998MS
-- prefixSize = 3:         memory = 8.7062263488770MB, parseTime = 0.232252S, checkTime = 0.017999999999962MS and searchTime = 0.056000000000056MS
-- prefixSize = 4:         memory = 9.3562326431274MB, parseTime = 0.252770S, checkTime = 0.015000000000098MS and searchTime = 0.024000000000024MS
-- prefixSize = 5:         memory = 10.468061447144MB, parseTime = 0.233367S, checkTime = 0.016000000000016MS and searchTime = 8.2719999999998MS
-- prefixSize = 6:         memory = 11.862153053284MB, parseTime = 0.254934S, checkTime = 0.018000000000074MS and searchTime = 14.833MS
-- prefixSize = 7:         memory = 12.316210746765MB, parseTime = 0.271774S, checkTime = 0.019999999999687MS and searchTime = 21.792MS
-- prefixSize = 8:         memory = 12.647994995117MB, parseTime = 0.311107S, checkTime = 0.016000000000016MS and searchTime = 19.854MS

-- searchKeyword = social
-- Table:                  memory = 8.8992023468018MB, parseTime = 0.180162S, checkTime = 0.008000000000008MS and searchTime = 20.876MS
-- prefixSize = 1:         memory = 9.0031824111938MB, parseTime = 0.188104S, checkTime = 0.013999999999958MS and searchTime = 2.264MS
-- prefixSize = 2:         memory = 8.7877130508423MB, parseTime = 0.206888S, checkTime = 0.014999999999987MS and searchTime = 0.12000000000001MS
-- prefixSize = 3:         memory = 8.7062005996704MB, parseTime = 0.224529S, checkTime = 0.017000000000045MS and searchTime = 0.018999999999991MS
-- prefixSize = 4:         memory = 9.3562068939209MB, parseTime = 0.240770S, checkTime = 0.016000000000016MS and searchTime = 0.016000000000016MS
-- prefixSize = 5:         memory = 10.468093872070MB, parseTime = 0.236687S, checkTime = 0.013999999999958MS and searchTime = 0.008000000000008MS
-- prefixSize = 6:         memory = 11.862127304077MB, parseTime = 0.244813S, checkTime = 0.014999999999876MS and searchTime = 11.436MS
-- prefixSize = 7:         memory = 12.316184997559MB, parseTime = 0.263059S, checkTime = 0.021999999999966MS and searchTime = 16.899MS
-- prefixSize = 8:         memory = 12.647969245911MB, parseTime = 0.313078S, checkTime = 0.017000000000156MS and searchTime = 20.171MS
