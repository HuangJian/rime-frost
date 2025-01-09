local stringUtil = require("../lib/string_util")
local luaunit = require("luaunit")

TestStringUtil = {}

function TestStringUtil:testUtf8Gsub()
    -- Test replacing accented 'a' characters with 'a'
    local input = "hāo háo hǎo hào hao"
    local expected = "hao hao hao hao hao"
    local output = stringUtil.utf8_gsub(input, "ā", "a")
    output = stringUtil.utf8_gsub(output, "á", "a")
    output = stringUtil.utf8_gsub(output, "ǎ", "a")
    output = stringUtil.utf8_gsub(output, "à", "a")
    luaunit.assertEquals(output, expected)

    -- Test replacing a single character
    input = "你好，世界"
    expected = "你a，世界"
    output = stringUtil.utf8_gsub(input, "好", "a")
    luaunit.assertEquals(output, expected)

    -- Test replacing a substring
    input = "你好，世界"
    expected = "你a，世界"
    output = stringUtil.utf8_gsub(input, "你好", "你a")
    luaunit.assertEquals(output, expected)

    -- Test replacing multiple occurrences
    input = "测试测试测试"
    expected = "a试a试a试"
    output = stringUtil.utf8_gsub(input, "测", "a")
    luaunit.assertEquals(output, expected)
end

os.exit(luaunit.LuaUnit.run())
