-- http://lua-users.org/lists/lua-l/2014-04/msg00590.html
local function utf8_sub(s, i, j)
    i = i or 1
    j = j or -1

    if i < 1 or j < 1 then
        local n = utf8.len(s)
        if not n then return nil end
        if i < 0 then i = n + 1 + i end
        if j < 0 then j = n + 1 + j end
        if i < 0 then i = 1 elseif i > n then i = n end
        if j < 0 then j = 1 elseif j > n then j = n end
    end

    if j < i then return "" end

    ---@diagnostic disable-next-line: missing-parameter
    i = utf8.offset(s, i)
    ---@diagnostic disable-next-line: missing-parameter
    j = utf8.offset(s, j + 1)

    if i and j then
        return s:sub(i, j - 1)
    elseif i then
        return s:sub(i)
    else
        return ""
    end
end

local split = function(str, sep, nmax)
    local find, sub = string.find, string.sub

    if sep == nil then sep = '%s+' end
    local r = {}
    if #str <= 0 then return r end
    local plain = false
    nmax = nmax or -1
    local nf = 1
    local ns = 1
    local nfr, nl = find(str, sep, ns, plain)
    while nfr and nmax ~= 0 do
        r[nf] = sub(str, ns, nfr - 1)
        nf = nf + 1
        ns = nl + 1
        nmax = nmax - 1
        nfr, nl = find(str, sep, ns, plain)
    end
    r[nf] = sub(str, ns)
    return r
end

-- Function to replace all occurrences of a substring in a UTF-8 string
local function utf8_gsub(str, target, replacement)
    local result = {}
    local targetLen = #target
    local i = 1

    while i <= #str do
        local char = str:sub(i, i + targetLen - 1)
        if char == target then
            table.insert(result, replacement)
            i = i + targetLen
        else
            local byte = str:byte(i)
            if byte >= 0xF0 then
                table.insert(result, str:sub(i, i + 3))
                i = i + 4
            elseif byte >= 0xE0 then
                table.insert(result, str:sub(i, i + 2))
                i = i + 3
            elseif byte >= 0xC0 then
                table.insert(result, str:sub(i, i + 1))
                i = i + 2
            else
                table.insert(result, str:sub(i, i))
                i = i + 1
            end
        end
    end

    return table.concat(result)
end

local function getUnaccentedChar(char)
    local replacements = {
        ['ā'] = 'a',
        ['á'] = 'a',
        ['ǎ'] = 'a',
        ['à'] = 'a',
        ['ē'] = 'e',
        ['é'] = 'e',
        ['ě'] = 'e',
        ['è'] = 'e',
        ['ī'] = 'i',
        ['í'] = 'i',
        ['ǐ'] = 'i',
        ['ì'] = 'i',
        ['ō'] = 'o',
        ['ó'] = 'o',
        ['ǒ'] = 'o',
        ['ò'] = 'o',
        ['ū'] = 'u',
        ['ú'] = 'u',
        ['ǔ'] = 'u',
        ['ù'] = 'u',
        ['ǖ'] = 'v',
        ['ǘ'] = 'v',
        ['ǚ'] = 'v',
        ['ǜ'] = 'v',
        ['ü'] = 'v'
    }

    for accentedChar, replacement in pairs(replacements) do
        if accentedChar == char then return replacement end
    end
    return char
end

-- replace all accented characters with their non-accented equivalents
local function unaccent(str)
    local result = {}
    local i = 1
    local strLen = #str

    while i <= strLen do
        local byte = str:byte(i)
        if byte >= 0xC0 then
            local char = str:sub(i, i + 1)
            local unaccented = getUnaccentedChar(char)
            table.insert(result, unaccented)
            i = i + 2
        elseif byte >= 0xF0 then
            table.insert(result, str:sub(i, i + 3))
            i = i + 4
        elseif byte >= 0xE0 then
            table.insert(result, str:sub(i, i + 2))
            i = i + 3
        else
            table.insert(result, str:sub(i, i))
            i = i + 1
        end
    end

    return table.concat(result)
end

-- Returns the Levenshtein distance between the two given strings
-- https://gist.github.com/Badgerati/3261142
local function levenshtein(str1, str2)
    local len1 = string.len(str1)
    local len2 = string.len(str2)
    local matrix = {}
    local cost = 0

    -- quick cut-offs to save time
    if (len1 == 0) then
        return len2
    elseif (len2 == 0) then
        return len1
    elseif (str1 == str2) then
        return 0
    end

    -- initialise the base matrix values
    for i = 0, len1, 1 do
        matrix[i] = {}
        matrix[i][0] = i
    end
    for j = 0, len2, 1 do matrix[0][j] = j end

    -- actual Levenshtein algorithm
    for i = 1, len1, 1 do
        for j = 1, len2, 1 do
            if (str1:byte(i) == str2:byte(j)) then
                cost = 0
            else
                cost = 1
            end

            matrix[i][j] = math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost)
        end
    end

    -- return the last value - this is the Levenshtein distance
    return matrix[len1][len2]
end

return {
    split = split,
    utf8_sub = utf8_sub,
    utf8_gsub = utf8_gsub,
    unaccent = unaccent,
    levenshtein = levenshtein
}
