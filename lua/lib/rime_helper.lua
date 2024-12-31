local function get_picking_candidate(key, segment)
    local keyvalue = key:repr()
    local idx = -1
    if keyvalue == 'space' or keyvalue == 'Return' then
        idx = 0
    elseif string.find(keyvalue, '^[1-9]$') then
        idx = tonumber(keyvalue) - 1
    elseif keyvalue == '0' then
        idx = 9
    end

    if idx >= 0 and idx < segment.menu:candidate_count() then
        return segment:get_candidate_at(idx) -- 获取指定项 从0起
    end
end


return {
    get_picking_candidate = get_picking_candidate
}
