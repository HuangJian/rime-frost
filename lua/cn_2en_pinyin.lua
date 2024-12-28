local dict = {}

local function isChineseWord(word)
    return word:match("[\228-\233][\128-\191][\128-\191]")
end

local Filter = {}

-- line format: 不可数集 [bù kě shuò jí] /uncountable set (math.)/
function Filter.parseLine(line)
    local w = {}
    local word, pinyin, desc = line:match("^(.-) %[(.-)%] /(.+)/.*$")
    if not word or word:len() < 1 then return end

    w.info = pinyin .. desc
    return {
        word = word,
        info = pinyin .. '|' .. desc
    }
end

function Filter.init(env)
    ---@diagnostic disable-next-line: undefined-global
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

function Filter.func(input, seg, env)
    for cand in input:iter() do
        -- UTF-8: 3 bytes per Chinese character.
        if isChineseWord(cand.text) then
            local info = dict[cand.text]
            if info then
                local pinyin, en = info:match("^(.-)|(.+)$")
                cand.comment = '〖' .. pinyin .. '〗' .. en
            end
        end
        yield(cand)
    end
end

return Filter
