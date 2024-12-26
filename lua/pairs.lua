-- 自动补全配对的符号，并把光标左移到符号对内部
-- ref: https://github.com/hchunhui/librime-lua/issues/84

local function moveCursorToLeft()
    -- 似乎 2023 年后失效，macOS 系统升级后受限制？
    
    -- local osascript = [[osascript -e '
    --    tell application "System Events" to tell front process
    --       key code 123 # Left Arrow
    --    end tell
    -- ']]
    -- os.execute(osascript)
end

local pairTable = {
    ["\""] = "\"",
    ["“"] = "”",
    ["'"] = "'",
    ["‘"] = "’",
    ["("] = ")",
    ["（"] = "）",
    ["「"] = "」",
    ["["] = "]",
    ["【"] = "】",
    ["〔"] = "〕",
    ["［"] = "］",
    ["〚"] = "〛",
    ["〘"] = "〙",
    ["{"] = "}",
    ["『"] = "』",
    ["〖"] = "〗",
    ["｛"] = "｝",
    ["《"] = "》",
};


local pairs = {}

function pairs.init(env)
    -- local config = env.engine.schema.config
    -- env.first_key = config:get_string('key_binder/select_first_character')
    -- env.last_key = config:get_string('key_binder/select_last_character')
end

function pairs.func(key, env)
    local engine = env.engine
    local context = env.engine.context
    local composition = context.composition
    local segment = composition:back()
    -- local candidate_count = segment.menu:candidate_count() -- 候选项数量
    -- local selected_candidate=segment:get_selected_candidate() -- 焦点项

    if context:has_menu() or context:is_composing() then
        local keyvalue = key:repr()
        local idx = -1
        if keyvalue == 'space' then
            idx = 0
        elseif string.find(keyvalue, '^[1-9]$') then
            idx = tonumber(keyvalue) - 1
        elseif keyvalue == '0' then
            idx = 9
        end

        if idx >= 0 and idx < segment.menu:candidate_count() then
            local candidateText = segment:get_candidate_at(idx).text -- 获取指定项 从0起
            local pairedText = pairTable[candidateText]
            if pairedText then
                engine:commit_text(candidateText)
                engine:commit_text(pairedText)
                context:clear()

                moveCursorToLeft()

                return 1 -- kAccepted 收下此key
            end
        end
    end

    -- return 0 -- kRejected librime 不處理
    return 2 -- kNoop 此processor 不處理
end

return pairs
