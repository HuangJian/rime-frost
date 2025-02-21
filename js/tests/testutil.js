export function assertEquals(actual, expected, msg) {
  const a = JSON.stringify(actual)
  const b = JSON.stringify(expected)
  if (a !== b) {
    throw 'FAIL: ' + msg + '\n  Expected: ' + b + '\n  Actual:  ' + a
  } else if (msg) {
    console.log('PASS: ' + msg)
  }
}

export function getDetailedRuntimeInfo() {
  const info = {
    runtime: 'Unknown',
    version: 'Unknown',
    features: [],
  }

  // Check available globals and features
  if (typeof globalThis !== 'undefined') {
    info.features.push('globalThis')
  }

  if (typeof Bun !== 'undefined') {
    info.runtime = 'Bun'
    info.version = Bun.version
    info.features.push('Bun native')
  } else if (typeof Deno !== 'undefined') {
    info.runtime = 'Deno'
    info.version = Deno.version.deno
    info.features.push('Deno native')
  } else if (typeof process !== 'undefined' && process.versions?.node) {
    info.runtime = 'Node.js'
    info.version = process.version
    info.features.push('CommonJS')

    // Check if running in ES modules mode
    if (typeof require === 'undefined' && typeof import.meta !== 'undefined') {
      info.features.push('ES Modules')
    }

    // Add Node.js specific features
    if (process.features) {
      Object.keys(process.features).forEach((feature) => {
        if (process.features[feature]) {
          info.features.push(feature)
        }
      })
    }
  } else if (globalThis.navigator?.userAgent.includes('quickjs')) {
    info.runtime = 'QuickJS'
    // quickjs-ng/0.8.0'
    const ua = globalThis.navigator?.userAgent
    if (ua) {
        info.runtime = ua.split('/')[0]
        info.version = ua.split('/')[1]
    }
    info.features.push('QuickJS native')
  }

  return info
}
