local rime_helper = require "lib/rime_helper"

local shortcutData = require('./data/shortcut_data')

local processor = {}

function processor.init(env)
end

function processor.func(key, env)
    local engine = env.engine
    local context = engine.context
    local segment = context.composition:back()

    if segment.prompt:match("〔快捷指令〕") then
        local pickingCandidate = rime_helper.get_picking_candidate(key, segment)
        if not pickingCandidate then return 2 end -- kNoop 此processor 不處理

        local shortcut = pickingCandidate.text
        for _, v in ipairs(shortcutData) do
            if shortcut == v.input then
                os.execute(v.command)
                context:clear()
                return 1 -- kAccepted 收下此key
            end
        end
    end

    -- return 0 -- kRejected librime 不處理
    return 2 -- kNoop 此processor 不處理
end

return processor
