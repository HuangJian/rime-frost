local dict = {}

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

function Filter.init(env)
    ---@diagnostic disable-next-line: undefined-global
    local fileAbsolutePath = rime_api.get_user_data_dir() .. "/lua/data/ecdict.txt"
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
        if cand.text:match("^[%a'- ]+$") then
            if cand.type == 'table' or cand.type == 'completion' then
                local text = cand.text:lower()
                local info = dict[text]
                if info then
                    cand.comment = string.gsub(info, '\\n', '\n\t\t')
                end
            end
        end
        yield(cand)
    end
end

return Filter
