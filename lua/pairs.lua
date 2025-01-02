-- 自动补全配对的符号，并把光标左移到符号对内部
-- ref: https://github.com/hchunhui/librime-lua/issues/84

local rime_helper = require("./lib/rime_helper")

-- 如果失效，在 Accessibility 里删除 Squirrel，然后重新添加
-- Accessibility 打开路径： System Preferences -> Security & Privacy -> Privacy -> Accessibility
-- Squirrel.app 位置：/Library/Input Methods/Squirrel.app
local function moveCursorToLeft()
    local osascript = [[osascript -e '
        tell application "System Events" to tell front process
            key code 123 # Left Arrow
        end tell
    ']]
    io.popen(osascript)
end

local pairTable = {
    ["\""] = "\"",
    ["`"] = "`",
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
end

function pairs.func(key, env)
    local engine = env.engine
    local context = env.engine.context
    local composition = context.composition
    local segment = composition:back()

    if context:has_menu() or context:is_composing() then
        local pickingCandidate = rime_helper.get_picking_candidate(key, segment)
        if not pickingCandidate then return 2 end -- kNoop 此processor 不處理

        local symbol = pickingCandidate.text
        local pairedText = pairTable[symbol]
        if pairedText then
            engine:commit_text(symbol)
            engine:commit_text(pairedText)
            context:clear()

            moveCursorToLeft()

            return 1 -- kAccepted 收下此key
        end
    end

    -- return 0 -- kRejected librime 不處理
    return 2 -- kNoop 此processor 不處理
end

return pairs
