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

    -- loadDictionaryialiseialise the base matrix values
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
    levenshtein = levenshtein
}
