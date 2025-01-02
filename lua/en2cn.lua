local dict = {}

-- 第一层索引 key 长度为 3 时，性能表现最佳。测试数据见 ./test/en2cn.pfm.lua
local firstLevelKeySize = 3

local Filter = {}

--  format: sometimes	['sʌmtaimz]; adv. 有时, 时常, 往往
function Filter.parseLine(line)
    local word, info = line:match("^(.-)%s+(.+)%s*$")
    if not word or word:len() < 1 then return end

    return {
        word = word:lower(),
        info = info
    }
end

local function searchByPrefix(prefix)
    local ret = {}
    if #prefix > firstLevelKeySize then
        local secondLevelDict = dict[prefix:sub(1, firstLevelKeySize)] or {}
        local secondLevelKeyword = prefix:sub(firstLevelKeySize + 1)
        for key, value in pairs(secondLevelDict) do
            if key:sub(1, #secondLevelKeyword) == secondLevelKeyword then
                local word = prefix .. key:sub(#secondLevelKeyword + 1)
                ret[word] = { word = word, info = value }
            end
        end
    else
        for key, _ in pairs(dict) do
            if key:sub(1, #prefix) == prefix then
                for key2, info in pairs(dict[key]) do
                    local word = key .. key2
                    ret[word] = { word = word, info = info }
                end
            end
        end
    end

    return ret
end

local function isPureEnglish(word)
    return word:match("^[%a'- ]+$")
end

local function insertFoundWords(candidatesToMenu, wordsByPrefix, prefixSize)
    -- 插到最后一个英文候选项之后；没有任何候选项就从头插入；只有中文没有英文候选项，那就插到第五个之后。
    local lastEnglishCandidateIndex = #candidatesToMenu == 0 and 1 or 5

    local existedWords = {}
    for i = 1, #candidatesToMenu do
        local word = candidatesToMenu[i].text
        if isPureEnglish(word) then
            existedWords[word] = true
            lastEnglishCandidateIndex = i
        end
    end

    for i, _ in pairs(wordsByPrefix) do
        local item = wordsByPrefix[i]
        if not existedWords[item.word] then
            local cand = Candidate("en", 0, prefixSize, item.word, string.gsub(item.info, '\\n', '\n\t\t'))
            -- 插到最后一个英文单词候选项之后，避免把前面的中文词语都刷到后面
            table.insert(candidatesToMenu, lastEnglishCandidateIndex, cand)
            lastEnglishCandidateIndex = lastEnglishCandidateIndex + 1
        end
    end
end

function Filter.init(env)
    local fileAbsolutePath = rime_api.get_user_data_dir() .. "/lua/data/ecdict.txt"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then return end

    for line in file:lines() do
        local w = Filter.parseLine(line)
        if w then
            local key = w.word:sub(1, firstLevelKeySize)
            dict[key] = dict[key] or {}
            dict[key][w.word:sub(firstLevelKeySize + 1)] = w.info
        end
    end
    file:close()
end

function Filter.func(input, env)
    local candidatesToMenu = {}

    for cand in input:iter() do
        if cand.text:match("^[%a'- ]+$") then
            local text = cand.text:lower()
            local level1Dict = dict[text:sub(1, firstLevelKeySize):lower()] or {}
            local info = level1Dict[text:sub(firstLevelKeySize + 1)]
            if info then
                cand.comment = string.gsub(info, '\\n', '\n\t\t')
            end
        end
        table.insert(candidatesToMenu, cand)
    end

    local prefix = env.engine.context.input:lower()
    if #prefix > 2 and isPureEnglish(prefix) then
        local wordsByPrefix = searchByPrefix(prefix)
        insertFoundWords(candidatesToMenu, wordsByPrefix, #prefix)
    end

    for i = 1, #candidatesToMenu do yield(candidatesToMenu[i]) end
end

return Filter
