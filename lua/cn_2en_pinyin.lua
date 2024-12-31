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

local hintCodes = 'ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ'
local hintKeys = 'nabcdefghijklmoprstuvwxyz'

local function tryTranslateToEnglish(typedText, engine, candidateList)
    if #typedText < 3 then return end

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
                local enCandidate = Candidate("en", 0, #typedText, arr[i], "翻译自：" .. pickingItem.candidate.text)
                enCandidate.quality = 999
                yield(enCandidate)
            end
        end
        yield(pickingItem.candidate) -- 把对应的汉语候选项移到最上面
    end
end

function Filter.func(input, env)
    local cands = {}
    local candidatesWithEnglish = {}

    for cand in input:iter() do
        if isChineseWord(cand.text) then
            local info = dict[cand.text]
            if info then
                local pinyin, en = info:match("^(.-)|(.+)$")
                cand.comment = '〖' .. pinyin .. '〗' .. en
                table.insert(candidatesWithEnglish, { candidate = cand, pinyin = pinyin, en = en })
            end
        end
        table.insert(cands, cand)
    end

    tryTranslateToEnglish(env.engine.context.input, env.engine, candidatesWithEnglish)

    for i = 1, #cands do
        yield(cands[i])
    end
end

return Filter
