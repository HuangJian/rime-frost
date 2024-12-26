local util = require("./util")

local dict = {}

local function parseLine(line)
    local w = {}
    local word, info = table.unpack(util.split(line, "\t"))
    if word:len() < 1 then return end

    w.word = word:lower()
    info = info or ""

    local head, tail = info:find('^%[.*%];')
    if head and tail then
        w.phonics = info:sub(head, tail - 1)
        w.info = info:sub(tail + 1)
    else
        w.phonics = ''
        w.info = info
    end
    w.info = string.gsub(w.info, '\\n', '\n\t\t')
    return w
end


local Filter = {}

function Filter.init(env)
    local alphabet = 'abcdefghijklmnopqrstuvwxyz'
    for i = 1, alphabet:len(), 1 do
        dict[alphabet:sub(i, i)] = {}
    end

    ---@diagnostic disable-next-line: undefined-global
    local fileAbsolutePath = rime_api.get_user_data_dir() .. "/lua/english_desc/english_desc.txt"
    local file = io.open(fileAbsolutePath, "r")
    if file == nil then return end

    for line in file:lines() do
        if not line:match("^#") then -- 第一字 #  不納入字典
            local w = parseLine(line)
            if w then
                local firstChar = string.sub(w.word, 1, 1):lower()
                table.insert(dict[firstChar], w)
            end
        end
    end
    file:close()
end

function Filter.func(input, seg, env)
    for cand in input:iter() do
        if cand.text:match("^[%a'- ]+$") then
            local found = false
            if cand.type == 'table' or cand.type == 'completion' then
                local text = cand.text:lower()
                local firstChar = string.sub(text, 1, 1)
                for _, v in pairs(dict[firstChar]) do
                    if v.word == text then
                        cand.comment = v.phonics .. v.info
                        found = true
                    end
                end
            end

            if not found then
                cand.comment = 'debug:type=' .. cand.type .. ' ' .. cand.comment
            end
        end
        yield(cand)
    end
end

return Filter
