import { normalizeInputToUrl, isValidNavigationUrl } from '../src/main/urlUtils'

function runTests() {
  console.log('--- Running Astrix Browser URL Validation Tests ---')

  const testCases: [string, string][] = [
    ['https://example.com', 'https://example.com'],
    ['http://example.org/path', 'http://example.org/path'],
    ['github.com', 'https://github.com'],
    ['localhost:3000', 'http://localhost:3000'],
    ['astrix://newtab', 'astrix://newtab'],
    ['astrix browser', 'https://www.google.com/search?q=astrix%20browser'],
    ['hello world search', 'https://www.google.com/search?q=hello%20world%20search'],
    ['', 'astrix://newtab']
  ]

  let passed = 0
  for (const [input, expected] of testCases) {
    const result = normalizeInputToUrl(input)
    if (result === expected) {
      passed++
    } else {
      console.error(`FAILED: "${input}" -> Got "${result}", Expected "${expected}"`)
    }
  }

  // Security test: blocked schemes
  let blockedPassed = false
  try {
    normalizeInputToUrl('javascript:alert(1)')
  } catch {
    blockedPassed = true
  }

  if (blockedPassed) {
    passed++
  } else {
    console.error('FAILED: javascript: scheme was not blocked!')
  }

  console.log(`Summary: ${passed}/${testCases.length + 1} tests passed.`)
}

runTests()
