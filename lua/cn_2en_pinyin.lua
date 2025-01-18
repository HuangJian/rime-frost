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

local splitter = "\\\\"

local isFilterInitialized = false -- 重启输入法有时会初始化插件两次，导致字典被加载两次。绕过之。
function Filter.init(env)
    if isFilterInitialized then
        -- log.writeLog('isFilterInitialized = true')
        return
    end

    local fileAbsolutePath = rime_api.get_user_data_dir() .. "/lua/data/cedict_fixed.u8"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then return end

    for line in file:lines() do
        local w = Filter.parseLine(line)
        -- there might be multiple entries of the same word, store them together
        if w then
            local previous = dict[w.word]
            if previous then
                dict[w.word] = previous .. splitter .. w.info  -- Append if already exists
            else
                dict[w.word] = w.info
            end
        end
    end
    file:close()
    isFilterInitialized = true
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

function Filter.func(input, env)
    local typedText = env.engine.context.input
    -- 忽略 / 后的字符，如 `zhangk/e` 只用 `zhangk` 来匹配
    -- 以免选择汉译英时，按下 `/e` 又把 `展开` 顶到最上面
    local prefix = typedText:gsub('(/.*)', '')

    local fullyMatched = {}
    local partialyMatched = {}
    local others = {}

    local candidatesWithCedict = {}

    for cand in input:iter() do
        local isCandidateInserted = false
        if isChineseWord(cand.text) then
            local info = dict[cand.text]
            if info then
                local arr = stringUtil.split(info, splitter)
                for i = 1, #arr, 1 do
                    local pinyin, en = arr[i]:match("^(.-)|(.+)$")
                    -- 多音字，仅在输入字符和拼音完全匹配时，显示拼音和英文注释，避免刷屏
                    local unaccentedPinyin = stringUtil.unaccent(pinyin:gsub(' ', ''))
                    local isInputMatchingPinyin = unaccentedPinyin:sub(1, #prefix) == prefix
                    if isInputMatchingPinyin then
                        local comment = '〖' .. pinyin .. '〗' .. en
                        local candidate = Candidate("cn", 0, #prefix, cand.text, comment)
                        if unaccentedPinyin == prefix then
                            table.insert(fullyMatched, candidate)
                        else
                            table.insert(partialyMatched, candidate)
                        end
                        isCandidateInserted = true

                        table.insert(candidatesWithCedict, {
                            candidate = candidate,
                            pinyin = pinyin,
                            en = en,
                        })
                    end
                end
            end
        end
        if not isCandidateInserted then
            -- 用户词典、整句联想，与完全匹配的优先级最高
            if cand.type == "user_phrase" or cand.type == "sentence" then
                table.insert(fullyMatched, cand)
            else
                table.insert(others, cand)
            end
        end
    end

    tryTranslateToEnglish(typedText, env.engine, candidatesWithCedict)
    tryTranslateToPinyin(typedText, env.engine, candidatesWithCedict)

    for _, v in ipairs(fullyMatched) do yield(v) end
    for _, v in ipairs(partialyMatched) do yield(v) end
    for _, v in ipairs(others) do yield(v) end
end

return Filter
