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

-- 重排汉字候选项，把拼音与输入完全匹配的候选项往前移
-- 只重排前面二十项，避免性能损耗
local function sortTop20CnCandidatesByPinyin(typedText, candidatesWithCedict, candsToYield)
    -- 忽略 / 后的字符，如 `zhangk/e` 只用 `zhangk` 来匹配
    -- 以免选择汉译英时，按下 `/e` 又把 `展开` 顶到最上面
    local prefix = typedText:gsub('(/.*)', '')
    local idxCandsToYield = {}
    local idxCandsWithCedict = {}
    local candidatesToSort = {}
    for i = 1, #candidatesWithCedict do
        if i <= 20 then
            local item = candidatesWithCedict[i]
            table.insert(idxCandsToYield, item.idx)
            table.insert(idxCandsWithCedict, i)
            table.insert(candidatesToSort, item)

            item.distance = 100 + i
            local unaccented = stringUtil.unaccent(item.pinyin:gsub(' ', ''))
            if unaccented:sub(1, #prefix) == prefix then
                item.distance = i
            end
        end
    end

    table.sort(candidatesToSort, function(a, b) return a.distance < b.distance end)

    for i = 1, #idxCandsToYield do
        candsToYield[idxCandsToYield[i]] = candidatesToSort[i].candidate
        idxCandsWithCedict[idxCandsWithCedict[i]] = candidatesToSort[i]
    end
end

function Filter.func(input, env)
    local startTime = os.clock()

    local cands = {}
    local candidatesWithCedict = {}

    local idx = 0
    for cand in input:iter() do
        idx = idx + 1
        if idx <= 100 and isChineseWord(cand.text) then
            local info = dict[cand.text]
            if info then
                local pinyin, en = info:match("^(.-)|(.+)$")
                cand.comment = '〖' .. pinyin .. '〗' .. en
                table.insert(candidatesWithCedict,
                    { candidate = cand, pinyin = pinyin, en = en, idx = idx, distance = 999 })
            end
        end
        table.insert(cands, cand)
    end

    sortTop20CnCandidatesByPinyin(env.engine.context.input, candidatesWithCedict, cands)

    tryTranslateToEnglish(env.engine.context.input, env.engine, candidatesWithCedict)
    tryTranslateToPinyin(env.engine.context.input, env.engine, candidatesWithCedict)

    if idx > 0 then
        local duration = (os.clock() - startTime) * 1000
        cands[1].comment = cands[1].comment .. '\n\t\t=== 汉译英耗时： ' .. duration .. 'ms ==='
    end
    for i = 1, idx do yield(cands[i]) end
end

return Filter
