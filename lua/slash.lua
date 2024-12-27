-- 连续按斜杠键（/）时，在候选符号中切换

local slash = {}
local direction = "Down"

function slash.init(env)
end

function slash.func(key, env)
    local engine = env.engine
    local context = engine.context
    local segment = context.composition:back()

    if context:has_menu() or context:is_composing() then
        if key:repr() == 'slash' and segment:get_candidate_at(0).text == '/' then
            if segment.selected_index >= segment.menu:candidate_count() - 1 then
                direction = "Up"
            elseif segment.selected_index == 0 then
                direction = "Down"
            end

---@diagnostic disable-next-line: undefined-global
            engine:process_key(KeyEvent(tostring(direction)))
            return 1 -- kAccepted 收下此key
        end
    end

    -- return 0 -- kRejected librime 不處理
    return 2 -- kNoop 此processor 不處理
end

return slash
