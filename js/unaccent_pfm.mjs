import assert, { strictEqual } from 'assert';
import { performance } from 'perf_hooks';

const accents = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü';
const without = 'aaaaeeeeiiiioooouuuuvvvvv';
const dict = {}
accents.split('').forEach((char, idx) => dict[char] = without[idx])

function unaccent(str) {
  // 22ms, 43MB
  // return str.split('').map((char, i) => {
  //   const index = accents.indexOf(char);
  //   return index !== -1 ? without[index] : char;
  // }).join('');

  // 22ms, 43MB
  // return str.split('').map((char, i) => {
  //   return dict[char] || char;
  // }).join('');

  // 10ms, 35MB
  // return str.replace(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/g, (match, p1) => {
  //   return dict[match]
  // })

  // 10ms, 34MB
  return str
    .replaceAll(/[āáǎà]/g, 'a')
    .replaceAll(/[ēéěè]/g, 'e')
    .replaceAll(/[īíǐì]/g, 'i')
    .replaceAll(/[ōóǒò]/g, 'o')
    .replaceAll(/[ūúǔù]/g, 'u')
    .replaceAll(/[ǖǘǚǜü]/g, 'v')
}

function testReplaceAccentedChars() {
  const input = 'hāppy tō mēēt yóu! '.repeat(10_000); // Large input for performance testing
  const startTime = performance.now();

  const output = unaccent(input);
  const endTime = performance.now();
  const elapsedTime = endTime - startTime;


  // Get the memory usage of the Node.js process
  const memoryUsage = process.memoryUsage();

  // Convert the memory usage from bytes to megabytes and print it
  console.log('Memory Usage:');
  console.log(`RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Array Buffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB`);

  // Verify correctness
  strictEqual(output.substring(0, 20), 'happy to meet you! h'); // Check partial output
  strictEqual(input.length, output.length);            // Ensure length matches

  console.log("elapsedTime = " + elapsedTime + " ms");
  assert(elapsedTime < 200, `Performance threshold exceeded: ${elapsedTime} ms`);
}

// Run the test
testReplaceAccentedChars();
