local stringUtil = require("../lib/string_util")
local luaunit = require("luaunit")
local utf8 = require("utf8")

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

function TestStringUtil:testReplaceAccentedChars()
    local input = string.rep("hāppy tō mēēt yóu! ", 10000) -- Large input for performance testing
    local startTime = os.clock()

    local output = stringUtil.unaccent(input)
    local endTime = os.clock()
    local elapsedTime = (endTime - startTime) * 1000

    -- Verify correctness
    luaunit.assertEquals(output:sub(1, 20), "happy to meet you! h") -- Check partial output
    luaunit.assertEquals(utf8.len(input), utf8.len(output))         -- Ensure length matches

    print("elapsedTime = " .. elapsedTime .. " ms")
    luaunit.assertTrue(elapsedTime < 200, "Performance threshold exceeded: " .. elapsedTime .. " ms")
end

os.exit(luaunit.LuaUnit.run())
