local stringUtil = require('./lib/string_util')

local dict = {}

local function isChineseWord(word)
    -- UTF-8: 3 bytes per Chinese character.
    return word:match("[\228-\233][\128-\191][\128-\191]")
end

local Filter = {}

-- line format: 不可数集 [bù kě shuò jí] /uncountable set (math.)/
function Filter.parseLine(line)
    local word, pinyin, desc = line:match("^(.-) %[(.-)%] /(.+)/.*$")
    if not word or word:len() < 1 then return end

    return {
        word = word,
        info = pinyin .. '|' .. desc
    }
end

function Filter.init(env)
    local fileAbsolutePath = rime_api.get_user_data_dir() .. "/lua/data/cedict_fixed.u8"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then return end

    for line in file:lines() do
        local w = Filter.parseLine(line)
        if w then
            dict[w.word] = w.info
        end
    end
    file:close()
end

local function tryTranslateToEnglish(typedText, engine, candidateList)
    if #typedText < 3 then return end

    local hintCodes = 'ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'
    local hintKeys = 'nabcdefghijklmoprstuvwxyz'
    if typedText:find('/e') then
        -- '/e' 启用汉译英上屏，注释上提示汉译英候选项的辅助码 => '/ea', '/eb', ...
        local idxHint = 1
        for i = 1, #candidateList do
            local item = candidateList[i]
            if item.en and idxHint <= #hintKeys then
                local hint = stringUtil.utf8_sub(hintCodes, idxHint, idxHint)
                item.candidate.comment = '⇖' .. hint .. item.candidate.comment
                idxHint = idxHint + 1
            end
        end
    end

    if typedText:sub(#typedText - 2, #typedText - 1) ~= '/e' then return end

    local lastChar = typedText:sub(#typedText)
    local idx = hintKeys:find(lastChar) or 100 --'/en' => 1st, '/ea' => 2nd, '/eb' => 3rd, ...
    local pickingItem = candidateList[idx]
    if not pickingItem then return end

    local arr = stringUtil.split(pickingItem.en, '/')
    if #arr == 1 then -- 唯一翻译，直接上屏
        engine:commit_text(arr[1])
        engine.context:clear()
    else -- 多种翻译，插入候选
        for i = 1, #arr, 1 do
            -- 量词部分不要候选: 上衣 [shàng yī] /jacket/upper outer garment/CL:件[jiàn]/
            if not arr[i]:find('CL') then
                yield(Candidate("en", 0, #typedText, arr[i], "翻译自：" .. pickingItem.candidate.text))
            end
        end
        yield(pickingItem.candidate) -- 把对应的汉语候选项移到最上面
    end
end

local function tryTranslateToPinyin(typedText, engine, candidateList)
    if #typedText < 3 then return end

    local hintCodes = 'ʸᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣᶻ'
    local hintKeys = 'yabcdefghijklmnoprstuvwxz'
    if typedText:find('/p') then
        -- '/p' 启用拼音上屏，各候选项的注释上提示辅助码 => '/py', '/pa', ...
        local idxHint = 1
        for i = 1, #candidateList do
            local item = candidateList[i]
            if item.en and idxHint <= #hintKeys then
                local hint = stringUtil.utf8_sub(hintCodes, idxHint, idxHint)
                item.candidate.comment = '⇖' .. hint .. item.candidate.comment
                idxHint = idxHint + 1
            end
        end
    end

    if typedText:sub(#typedText - 2, #typedText - 1) ~= '/p' then return end

    local lastChar = typedText:sub(#typedText)
    local idx = hintKeys:find(lastChar) or 100 --'/py' => 1st, '/pa' => 2nd, '/pb' => 3rd, ...
    local pickingItem = candidateList[idx]
    if not pickingItem then return end

    local arr = stringUtil.split(pickingItem.pinyin, ' ')
    if #arr == 1 then -- 单字拼音，直接上屏
        engine:commit_text(arr[1])
        engine.context:clear()
    else
        -- 词组拼音插入候选
        yield(Candidate("py", 0, #typedText, pickingItem.pinyin, "拼音：" .. pickingItem.candidate.text))

        for i = 1, #arr, 1 do -- 拆开成单字后插入候选
            yield(Candidate("py", 0, #typedText, arr[i], "拼音：" .. pickingItem.candidate.text))
        end

        yield(pickingItem.candidate) -- 把对应的汉语候选项移到最上面
    end
end

-- Function to replace all accented characters with their non-accented equivalents
local function replaceAccentedChars(str)
    local replacements = {
        ['ā'] = 'a', ['á'] = 'a', ['ǎ'] = 'a', ['à'] = 'a',
        ['ē'] = 'e', ['é'] = 'e', ['ě'] = 'e', ['è'] = 'e',
        ['ī'] = 'i', ['í'] = 'i', ['ǐ'] = 'i', ['ì'] = 'i',
        ['ō'] = 'o', ['ó'] = 'o', ['ǒ'] = 'o', ['ò'] = 'o',
        ['ū'] = 'u', ['ú'] = 'u', ['ǔ'] = 'u', ['ù'] = 'u',
        ['ǖ'] = 'v', ['ǘ'] = 'v', ['ǚ'] = 'v', ['ǜ'] = 'v',
        ['ü'] = 'v'
    }

    for accentedChar, replacement in pairs(replacements) do
        str = stringUtil.utf8_gsub(str, accentedChar, replacement)
    end

    return str
end

-- 重排汉字候选项，把拼音与输入完全匹配的候选项往前移
-- 只重排前面二十项，避免性能损耗
local function sortTop20CnCandidatesByPinyin(typedText, candidateList)
    local idxArray = {}
    local wordsToSort = {}
    for i = 1, #candidateList do
        local cand = candidateList[i]
        if i <= 20 and isChineseWord(cand.text) and stringUtil.utf8_sub(cand.comment, 1, 1) == '〖' then
            local pinyin = cand.comment:match("^〖(.-)〗")
            if pinyin then
                local replaced = replaceAccentedChars(pinyin:gsub(' ', ''))
                local distance = 100 + i
                if replaced:sub(1, #typedText) == typedText then distance = i end

                table.insert(idxArray, i)
                table.insert(wordsToSort, {candidate = cand, distance = distance})
            end
        end
    end

    table.sort(wordsToSort, function (a, b) return a.distance < b.distance end)

    for i = 1, #idxArray do
        candidateList[idxArray[i]] = wordsToSort[i].candidate
    end
end

function Filter.func(input, env)
    local cands = {}
    local candidatesWithCedict = {}

    for cand in input:iter() do
        if isChineseWord(cand.text) then
            local info = dict[cand.text]
            if info then
                local pinyin, en = info:match("^(.-)|(.+)$")
                cand.comment = '〖' .. pinyin .. '〗' .. en
                table.insert(candidatesWithCedict, { candidate = cand, pinyin = pinyin, en = en })
            end
        end
        table.insert(cands, cand)
    end

    sortTop20CnCandidatesByPinyin(env.engine.context.input, cands)

    tryTranslateToEnglish(env.engine.context.input, env.engine, candidatesWithCedict)
    tryTranslateToPinyin(env.engine.context.input, env.engine, candidatesWithCedict)

    for i = 1, #cands do yield(cands[i]) end
end


return Filter
