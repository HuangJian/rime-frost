-- help_menu.lua
-- List features and usage of the schema.
-- https://github.com/boomker/rime-fast-xhup/blob/main/lua/flypy_help_menu.lua

local table = {
    { "帮助菜单", "→ /help" },
    -- { "小鹤键位", "→ /ok" },
    -- { "英文模式", "→ /oe" },
    -- { "中文数字", "→ /cn" },
    -- { "快捷指令", "→ /fj" },
    -- { "应用闪切", "→ /jk" },
    -- { "选项切换", "→ /so" },
    -- { "历史上屏", "→ /hs" },
    -- { "LaTeX 式", "→ /lt" },
    -- { "计算器🆚", "→ /="  },
    { "拆字反查", "→ uU 组合键，如`uUguili`反查出`魑〘chī〙`" },
    { "汉译英上屏", "→ /e* 组合键，如`shuxue/en`上屏`mathematics`" },
    { "拼音上屏", "→ /p* 组合键，如`pinyin/py1`上屏`pīn yīn`" },
    { "二三候选", "→ ;'号键" },
    { "上下翻页", "→ ,.号键" },
    { "以词定字", "→ []号键" },
    { "方案选单", "→ F4" },
    { "快捷指令", "→ /deploy /screenshot" },
    -- { "词条置顶", "→ Ctrl+t" },
    -- { "词条降频", "→ Ctrl+j" },
    -- { "词条隐藏", "→ Ctrl+x" },
    -- { "词条删除", "→ Ctrl+d" },
    -- { "删用户词", "→ Ctrl+k" },
    -- { "删上屏词", "→ Ctrl+r" },
    -- { "注解切换", "→ Ctrl+n" },
    -- { "注解上屏", "→ Ctrl+p" },
    -- { "单字优先", "→ Ctrl+s" },
    -- { "切换英打", "→ Ctrl+g" },
    -- { "Easydict", "→ Ctrl+y" },
    -- { "简拼展开", "→ Ctrl+0" },
    -- { "全角半角", "→ Ctrl+," },
    -- { "中英标点", "→ Ctrl+." },
    -- { "切换英打", "→ Ctrl+Shift+g" },
    -- { "表😂显隐", "→ Ctrl+Shift+4" },
    -- { "码区提示", "→ Ctrl+Shift+5" },
    -- { "繁简切换", "→ Ctrl+Shift+6" },
    -- { "以形查音", "→ ~键引导以形查音" },
    -- { "精准造词", "→ `键引导精准造词" },
    { "单词大写", "→ AZ 大写字母触发" },
    { "日期时间", "→ " .. "rq | sj | xq | dt | ts | nl" },
    -- { "最近几天", "→ " .. "/wqt | /wzt | /wmt | /wht" },
    -- { "最近几周", "→ " .. "/wuz | /wlk | /wxz | /wnk" },
    -- { "最近几月", "→ " .. "/wuy | /wlm | /wxy | /wnm" },
    -- { "项目地址", "→ " .. "boomker/rime-fast-xhup" },
}

local function libRimeLuaVersion()
    local ver
    if LevelDb then
        ver = 177
    elseif Opencc then
        ver = 147
    elseif KeySequence and KeySequence().repr then
        ver = 139
    elseif ConfigMap and ConfigMap().keys then
        ver = 127
    elseif Projection then
        ver = 102
    elseif KeyEvent then
        ver = 100
    elseif Memory then
        ver = 80
    else
        ver = 79
    end
    return ver
end

local function rimeInfo()
    -- reflects only the memory allocated by Lua itself and does not account for
    -- other processes or system-level memory usage
    local mem = collectgarbage("count") / 1024
    return string.format("Memory: %.2fM | Ver: librime %s librime-lua %s %s",
        mem,
        rime_api.get_rime_version(),
        libRimeLuaVersion(),
        _VERSION)
end

local T = {}

function T.func(input, seg, env)
    local composition = env.engine.context.composition
    local segment = composition:back()
    if #input > 2 and ("/help"):sub(1, #input) == input then
        segment.prompt = "〔帮助菜单〕" .. rimeInfo()
        for _, v in ipairs(table) do
            local cand = Candidate("help", seg.start, seg._end, v[1], v[2])
            cand.quality = 999
            yield(cand)
        end
    end
end

return T
