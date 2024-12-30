local stringUtil = require('./lib/string_util')

local processor = {}

function processor.init(env)
end

local function getPinyinPart(key)
    if key == 'Control+p' then return 'all' end
    if key == 'Control+bracketleft' then return 'left' end
    if key == 'Control+bracketright' then return 'right' end
end

local function fixPinyinByPart(pinyin, part)
    if part == 'all' then return pinyin end

    local arr = stringUtil.split(pinyin, ' ')
    if part == 'left' then return arr[1] end
    if part == 'right' then return arr[#arr] end
end

function processor.func(key, env)
    local engine = env.engine
    local context = engine.context
    local segment = context.composition:back()

    local pinyinPart = getPinyinPart(key:repr())
    if pinyinPart then
        local cand = segment:get_selected_candidate()
        local pinyin = cand.comment:match("^〖(.-)〗.*$")
        if pinyin then
            engine:commit_text(fixPinyinByPart(pinyin, pinyinPart))
            context:clear()

            return 1 -- kAccepted 收下此key
        end
    end

    return 2 -- kNoop 此processor 不處理
end

return processor
