// usage: `bash -c './qjs --dump ./unaccent_pfm_qjs.js'`
// the dump output memory size are counted by "bytes"

function assert(condition, message) {
  if (!condition) {
      throw new Error(message || "Assertion failed");
  }
}

const accents = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü';
const without = 'aaaaeeeeiiiioooouuuuvvvvv';
const dict = {}
accents.split('').forEach((char, idx) => dict[char] = without[idx])

function unaccent(str) {
  // 87ms, 92KB
  // return str.split('').map((char, i) => {
  //   const index = accents.indexOf(char);
  //   return index !== -1 ? without[index] : char;
  // }).join('');

  // 68ms, 92KB
  return str.split('').map((char, i) => {
    return dict[char] || char;
  }).join('');

  // 94ms, 92KB
  // return str.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (match, p1) => {
  //   return dict[match]
  // })

  // 102ms, 93KB
  // return str
  //   .replaceAll(/[āáǎà]/g, 'a')
  //   .replaceAll(/[ēéěè]/g, 'e')
  //   .replaceAll(/[īíǐì]/g, 'i')
  //   .replaceAll(/[ōóǒò]/g, 'o')
  //   .replaceAll(/[ūúǔù]/g, 'u')
  //   .replaceAll(/[ǖǘǚǜü]/g, 'v')
}

function testReplaceAccentedChars() {
  const input = 'hāppy tō mēēt yóu! '.repeat(10000); // Large input for performance testing
  const startTime = Date.now();

  const output = unaccent(input);
  const endTime = Date.now();
  const elapsedTime = endTime - startTime;

  // Verify correctness
  assert(output.substring(0, 20) === 'happy to meet you! h'); // Check partial output
  assert(input.length === output.length);            // Ensure length matches

  console.log("elapsedTime = " + elapsedTime + " ms");
  assert(elapsedTime < 300, `Performance threshold exceeded: ${elapsedTime} ms`);
}

// Run the test
testReplaceAccentedChars();
