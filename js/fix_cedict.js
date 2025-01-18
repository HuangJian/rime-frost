const fs = require('fs')

// download from https://www.mdbg.net/chinese/dictionary?page=cc-cedict
fs.readFile('../lua/data/cedict_ts.u8', 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    const processedData = data.split('\n').map((row, idx) => {
        if (idx % 10000 === 0) {
            console.log(idx, new Date())
        }

        if (row.startsWith('#')) { // keep the rows starting with #
            return row
        }
        if (row.includes('variant of') || row.includes('surname')) { // 不处理声调变种和姓氏翻译
            return null
        }
        const arr = row.split(' ')
        const traditionalWord = arr[0]
        const removed = row.substring(traditionalWord.length+1).replaceAll('，', '')
        return fixPinyin(removed)
    })
    .filter(it => it)
    .join('\n')

    fs.writeFile('../lua/data/cedict_fixed.u8', processedData, (err) => {
        if (err) {
            console.error(err)
            return
        }
        console.log('File has been saved.')
    })
    console.log(data.split('\n').length)
})

// 一瞬间 [yi1 shun4 jian1] /split second/ => 一瞬间 [yī shùn jiān] /split second/
function fixPinyin(row) {
    let ret = row
    Array.from(row.matchAll(/\[([a-zA-Z0-9\-: ,]+)\]/g))
        .forEach(match => {
            const pinyin = match[1]
            const fixed = fixYindiao(pinyin.replace(/u:/g, 'ü')).toLowerCase()
            const removed = fixed.replaceAll(' ,', '')
            ret = ret.replace(pinyin, removed)
        })
    return ret
}

const dict = {
    'a': 'āáǎàa',
    'e': 'ēéěèe',
    'o': 'ōóǒòo',
    'ü': 'ǖǘǚǜü',
    'i': 'īíǐìi',
    'u': 'ūúǔùu',
}
const yuanyinList = ['a', 'e', 'o', 'ü', 'i', 'u']

// yi1 gen1 sheng2 shang4 de5 ma4 zha5  =>  yī gēn shéng shàng de mà zha
function fixYindiao(pinyin) {
    return pinyin
        .split(' ')
        .map((word) => {
            let yuanyin = yuanyinList.reduce((ret, it) => ret || (word.includes(it) ? it : null), null)
            if (yuanyin) {
                if (word.includes('ui')) {
                    yuanyin = 'i'
                } else if (word.includes('iu')) {
                    yuanyin = 'u'
                }

                const yindiao = parseInt(word[word.length-1]) // 1-5
                return word
                    .substring(0, word.length - 1)
                    .replace(yuanyin, dict[yuanyin][yindiao-1])
            }
            return word
        })
        .join(' ')
}

function test() {
    const data = `
        一瞬间 [yi1 shun4 jian1] /split second/
        一矢中的 [yi1 shi3 zhong4 di4] /to hit the target with a single shot/to say something spot on (idiom)/
        一知半解 [yi1 zhi1 - ban4 jie3] /(idiom) to have a superficial knowledge of a subject; to know a smattering of sth/
        一石二鸟 [yi1 shi2 er4 niao3] /to kill two birds with one stone (idiom)/
        一碗水端平 [yi1 wan3 shui3 duan1 ping2] /lit. to hold a bowl of water level (idiom)/fig. to be impartial/
        一神教 [yi1 shen2 jiao4] /monotheistic religion/monotheism/
        一神论 [yi1 shen2 lun4] /monotheism/unitarianism (denying the Trinity)/
        一根绳上的蚂蚱 [yi1 gen1 sheng2 shang4 de5 ma4 zha5] /see 一條繩上的螞蚱|一条绳上的蚂蚱[yi1 tiao2 sheng2 shang4 de5 ma4 zha5]/
        一秉虔诚 [yi1 bing3 qian2 cheng2] /earnestly and sincerely (idiom); devoutly/
        一甲 [yi1 jia3] /1st rank or top three candidates who passed the imperial examination (i.e. 狀元|状元[zhuang4 yuan2], 榜眼[bang3 yan3], and 探花[tan4 hua1], respectively)/
        `

        data.split('\n').forEach(row => {
            const fixed = fixPinyin(row)
            console.log(row, ' => \n', fixed)
        })
}

// test()
