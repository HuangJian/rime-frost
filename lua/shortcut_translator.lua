local translator = {}

local shortcutData = require('./data/shortcut_data')

function translator.init(env)
end

function translator.func(input, seg, env)
    local composition = env.engine.context.composition
    local segment = composition:back()

    if #input > 2 and input:sub(1, 1) == '/' then
        for _, v in ipairs(shortcutData) do
            if v.input:find(input, 1, true) == 1 then
                segment.prompt = "〔快捷指令〕"
                local cand = Candidate("shortcut", seg.start, seg._end, v.input, v.desc)
                cand.quality = 999
                yield(cand)
            end
        end
    end
end

return translator
