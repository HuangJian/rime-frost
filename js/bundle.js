#!/usr/bin/env node

// usage: `node bundle.js [target]`
// target: all (default), jsc, qjs

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const cwd = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const target = args[0] || 'all'

// ========== main logic starts ==========
createDistDirIfNotExists()

const files = readdirSync(cwd).filter((f) => /\.(js|ts|cjs|mjs)$/.test(f) && f !== 'bundle.js')
if (target !== 'jsc') {
  // QuickJS leaks memory with the IIFE formatted code, bundle it with the ESM format
  // ESM format `class MyFilter {}; export { MyFilter };`
  // https://esbuild.github.io/api/#format-esm
  bundleToESM(files)
}
if (target !== 'qjs') {
  // JavaScriptCore does not support ESM, bundle it with the IIFE format
  // IIFE format`;(()=>{ var MyFilter = class {};...; this.instance = MyFilter();}()`
  // https://esbuild.github.io/api/#format-iife
  bundleToIIFE(files)
}

// Format all bundled files
execSync('prettier --config .prettierrc --write "dist/**/*.js"', { stdio: 'inherit', cwd })

// ========== main logic ends ==========

function createDistDirIfNotExists() {
  const distDir = join(cwd, 'dist')
  if (!existsSync(distDir)) {
    mkdirSync(distDir)
  }
}

function getBundleOptions(format) {
  const esbuildOptions = [
    '--bundle',
    '--platform=browser',
    '--allow-overwrite=true', // overwrite the output file
    '--tree-shaking=true', // remove unused code
    '--minify-whitespace', // remove comments and line breaks
    '--target=es2022',
  ]
  if (format === 'iife') {
    esbuildOptions.push('--format=iife')
  } else if (format === 'esm') {
    esbuildOptions.push('--format=esm')
  }
  return esbuildOptions
}

function bundleToESM(files) {
  console.log('Bundling the plugins to ESM format to run in QuickJS...')
  const options = getBundleOptions('esm').join(' ')
  files.forEach((f) => {
    execSync(`esbuild ${f} --outfile="./dist/${f.replace(/\.(js|ts|mjs|cjs)$/, '.esm.js')}" ${options}`, {
      stdio: 'inherit',
      cwd,
    })
  })
}

function bundleToIIFE(files) {
  console.log('Bundling the plugins to IIFE format to run in JavaScriptCore...')
  const options = getBundleOptions('iife').join(' ')
  files.forEach((file) => {
    const className = extractExportingPluginName(file)
    if (!className) {
      console.log(`No class exported in ${file}, skipping...`)
      return
    }

    const distFile = join(cwd, 'dist', file.replace(/\.(js|ts|mjs|cjs)$/, '.iife.js'))
    execSync(`esbuild ${file} --outfile=${distFile} ${options}`, {
      stdio: 'inherit',
      cwd,
    })
    injectPluginInitialization(distFile, className)
  })
}

// find the exporting class name: `export class TestProcessor {`
function extractExportingPluginName(file) {
  const fileContent = readFileSync(join(cwd, file), 'utf8')
  const classMatch = fileContent.match(/export\s*class\s*(\w*)\s*{/) || []
  return classMatch[1]
}

// append `globalThis.${instanceName}= new ${className}()\n}` to the end of the file, before `})();`
function injectPluginInitialization(file, className) {
  const filenName = basename(file)
  const instanceName = 'iife_instance_' + filenName.replace(/[.-]/g, '_')
  const fileContent = readFileSync(file, 'utf8')
  const newContent = fileContent.replace(
    /\}\)\(\);?\s*$/m,
    `globalThis.${instanceName} = new ${className}()\n})()`,
  )
  writeFileSync(file, newContent)
}
