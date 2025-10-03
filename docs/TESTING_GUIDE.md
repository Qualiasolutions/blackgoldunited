# Testing Guide

**Last Updated**: October 3, 2025
**Test Framework**: Jest 30.2.0 + React Testing Library 16.3.0

## Overview

BlackGoldUnited ERP uses Jest as its primary testing framework with React Testing Library for component tests and custom mocking infrastructure for Next.js 15 compatibility.

## Test Suite Statistics

- **Total Tests**: 57 (all passing)
- **Test Suites**: 3 files
- **Coverage**: ~20-25% (focused on critical utilities)
  - `lib/auth/permissions.ts`: 61% coverage
  - `lib/utils.ts`: 33% coverage
  - `lib/types/auth.ts`: 100% coverage

## Quick Start

### Running Tests

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode (for pipelines)
npm run test:ci

# Run specific test file
npx jest __tests__/lib/auth/permissions.test.ts

# Run tests without coverage
npx jest --no-coverage
```

## Test Infrastructure

### Configuration Files

1. **`jest.config.js`**
   - Main Jest configuration for Next.js 15
   - Coverage thresholds (60% branches, 65% functions, 70% lines/statements)
   - Module name mapping for `@/` alias
   - Test environment: `jsdom`

2. **`jest.setup.js`**
   - Global test setup and mocks
   - Web API polyfills (Request, Response, Headers, TextEncoder/Decoder)
   - Next.js router mocks
   - Supabase client mocks
   - Environment variable setup

3. **`package.json` scripts**
   ```json
   {
     "test": "jest --coverage",
     "test:watch": "jest --watch",
     "test:ci": "jest --ci --coverage --maxWorkers=2"
   }
   ```

### Mock Files

- `__mocks__/styleMock.js` - CSS module mocks
- `__mocks__/fileMock.js` - Image/file import mocks
- `helpers/test-helpers.ts` - Custom testing utilities

## Test Helpers

### Available Helpers (`helpers/test-helpers.ts`)

```typescript
// Mock user data for different roles
mockUsers.management
mockUsers.finance
mockUsers.procurement
mockUsers.hr
mockUsers.qhse

// Create mock requests
createMockRequest({ method, url, headers, body, user })

// Mock Supabase query builder
mockSupabaseQuery(data, error)

// Mock data creators
createMockClient(overrides)
createMockInvoice(overrides)
createMockPayment(overrides)

// Test assertion helpers
expectErrorResponse(response, status, errorMessage)
expectSuccessResponse(response, status)

// Utility helpers
delay(ms)
```

## Existing Test Suites

### 1. Permission Tests (`__tests__/lib/auth/permissions.test.ts`)

**17 test cases covering**:
- Module access checks for all 5 roles
- Full access vs READ access validation
- Permission checking with detailed error messages
- Edge cases (undefined inputs, case sensitivity)

```bash
npx jest __tests__/lib/auth/permissions.test.ts
```

### 2. Utility Tests (`__tests__/lib/utils.test.ts`)

**40 test cases covering**:
- `cn()` className utility
- Date utilities and formatting
- Number formatting and null safety
- String manipulation
- Array operations
- Object utilities
- Type checking
- Error handling
- Promise utilities

```bash
npx jest __tests__/lib/utils.test.ts
```

## Writing New Tests

### Test File Structure

```typescript
import { functionToTest } from '@/path/to/module'

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks()
  })

  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = functionToTest(input)

      // Assert
      expect(result).toBe('expected')
    })

    it('should handle error cases', () => {
      expect(() => functionToTest(null)).toThrow()
    })
  })
})
```

### Testing API Routes (Next.js 15)

API route tests require careful mocking due to Next.js 15's Web API compatibility:

```typescript
// Mock authentication
jest.mock('@/lib/auth/api-auth', () => ({
  authenticateAndAuthorize: jest.fn(async () => ({
    success: true,
    user: mockUsers.management,
  })),
}))

// Mock Supabase server
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    from: jest.fn(() => mockSupabaseQuery()),
  })),
}))

// Import route handlers AFTER mocks
import { GET, POST } from '@/app/api/endpoint/route'

describe('API Route', () => {
  it('should return data', async () => {
    const request = new Request('http://localhost:3000/api/endpoint', {
      method: 'GET',
      headers: { Authorization: 'Bearer test' },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### Testing Components

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from '@/components/Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component prop="value" />)

    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<Component />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

## Common Patterns

### 1. Testing Permissions

```typescript
import { hasModuleAccess, hasFullAccess } from '@/lib/auth/permissions'
import { UserRole } from '@/lib/types/auth'

it('should allow management access to all modules', () => {
  expect(hasModuleAccess(UserRole.MANAGEMENT, 'sales')).toBe(true)
  expect(hasFullAccess(UserRole.MANAGEMENT, 'sales')).toBe(true)
})
```

### 2. Testing Null Safety

```typescript
it('should handle null values safely', () => {
  const value = null
  const formatted = (value ?? 0).toLocaleString()
  expect(formatted).toBe('0')
})
```

### 3. Testing Async Functions

```typescript
it('should fetch data successfully', async () => {
  const mockData = { id: 1, name: 'Test' }
  mockSupabase.from.mockReturnValue(
    mockSupabaseQuery(mockData, null)
  )

  const result = await fetchData()

  expect(result).toEqual(mockData)
})
```

### 4. Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  mockSupabase.from.mockReturnValue(
    mockSupabaseQuery(null, { message: 'Database error' })
  )

  const result = await fetchData()

  expect(result.error).toBe('Database error')
})
```

## Coverage Reports

### Viewing Coverage

After running `npm test`, coverage reports are generated in:
- **Console**: Summary table
- **HTML Report**: `coverage/lcov-report/index.html`

```bash
# Generate coverage and open HTML report
npm test && open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current thresholds in `jest.config.js`:
- Branches: 60%
- Functions: 65%
- Lines: 70%
- Statements: 70%

## Known Issues & Workarounds

### 1. Next.js 15 Web API Compatibility

**Issue**: Next.js 15 uses Web APIs (Request, Response) that aren't available in Node.js test environment.

**Workaround**: Mock implementations in `jest.setup.js`:
```javascript
global.Request = class Request { ... }
global.Response = class Response { ... }
global.Headers = class Headers { ... }
```

### 2. Dynamic Imports

**Issue**: Some Next.js features use dynamic imports that fail in tests.

**Workaround**: Mock the module before importing:
```javascript
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn) => fn,
}))
```

### 3. Supabase SSR

**Issue**: `@/lib/supabase/server` uses cookies() which isn't available in tests.

**Workaround**: Mock the entire module:
```javascript
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({ /* mock client */ })),
}))
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
   - ✅ `should return 401 for unauthenticated requests`
   - ❌ `test auth`

2. **Test Independence**: Each test should be independent and not rely on other tests
   - Use `beforeEach` for setup
   - Use `afterEach` for cleanup

3. **Mock Sparingly**: Only mock what's necessary
   - Real utilities are better than mocks when possible
   - Mock external dependencies (Supabase, APIs)

4. **Coverage ≠ Quality**: Aim for meaningful tests, not just high coverage
   - Test edge cases and error paths
   - Test user-facing functionality

5. **Keep Tests Fast**: Fast tests = fast feedback loop
   - Avoid real API calls
   - Use `maxWorkers` to parallelize

## Future Improvements

### Planned Test Expansion

1. **API Route Tests** (Priority: High)
   - `/api/sales/*` endpoints
   - `/api/clients/*` endpoints
   - `/api/auth/*` endpoints

2. **Component Tests** (Priority: Medium)
   - Dashboard components
   - Form components
   - UI components

3. **E2E Tests** (Priority: Low)
   - Playwright or Cypress
   - Critical user flows
   - Cross-browser testing

4. **Integration Tests** (Priority: Medium)
   - Full request/response cycles
   - Database integration
   - Third-party service integration

### Coverage Goals

- **Short-term**: 45% → 70% (focus on API routes)
- **Long-term**: 70% → 85% (add component and E2E tests)

## Troubleshooting

### Tests Failing Unexpectedly

1. **Clear Jest cache**:
   ```bash
   npx jest --clearCache
   ```

2. **Check for stale mocks**:
   - Ensure `jest.clearAllMocks()` in `beforeEach`
   - Verify mock implementations

3. **TypeScript errors**:
   - Run `npm run type-check`
   - Check `tsconfig.json` configuration

### Slow Test Performance

1. **Reduce test parallelization**:
   ```bash
   npx jest --maxWorkers=1
   ```

2. **Profile tests**:
   ```bash
   npx jest --detectOpenHandles --detectLeaks
   ```

3. **Check for async issues**:
   - Use proper async/await
   - Avoid unnecessary delays

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Maintained By**: Development Team
**Questions**: See `/help` or create an issue in the project repository
