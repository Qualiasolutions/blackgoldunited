import { cn } from '@/lib/utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge classnames correctly', () => {
      const result = cn('class1', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toContain('base')
      expect(result).toContain('active')
    })

    it('should handle falsy values', () => {
      const result = cn('base', false && 'hidden', null, undefined)
      expect(result).toBe('base')
    })

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      // Should keep px-4 (last occurrence wins)
      expect(result).toContain('px-4')
      expect(result).toContain('py-1')
    })

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle object notation', () => {
      const result = cn({
        'base-class': true,
        'conditional-class': false,
        'active': true,
      })
      expect(result).toContain('base-class')
      expect(result).toContain('active')
      expect(result).not.toContain('conditional-class')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })

  describe('Date Utilities', () => {
    it('should format dates correctly', () => {
      const date = new Date('2025-10-03T12:00:00Z')
      const formatted = date.toISOString()
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle date comparisons', () => {
      const date1 = new Date('2025-10-03')
      const date2 = new Date('2025-10-04')
      expect(date1.getTime()).toBeLessThan(date2.getTime())
    })
  })

  describe('Number Utilities', () => {
    it('should format numbers with toLocaleString', () => {
      const num = 1000
      const formatted = (num ?? 0).toLocaleString()
      expect(formatted).toBe('1,000')
    })

    it('should handle null values safely', () => {
      const num = null
      const formatted = (num ?? 0).toLocaleString()
      expect(formatted).toBe('0')
    })

    it('should handle undefined values safely', () => {
      const num = undefined
      const formatted = (num ?? 0).toLocaleString()
      expect(formatted).toBe('0')
    })

    it('should format currency correctly', () => {
      const amount = 1234.56
      const formatted = (amount ?? 0).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      })
      expect(formatted).toBe('$1,234.56')
    })

    it('should round numbers correctly', () => {
      const num = 1.5678
      expect(Math.round(num * 100) / 100).toBe(1.57)
    })
  })

  describe('String Utilities', () => {
    it('should trim strings', () => {
      const str = '  test  '
      expect(str.trim()).toBe('test')
    })

    it('should convert to lowercase', () => {
      const str = 'TEST'
      expect(str.toLowerCase()).toBe('test')
    })

    it('should convert to uppercase', () => {
      const str = 'test'
      expect(str.toUpperCase()).toBe('TEST')
    })

    it('should check string inclusion', () => {
      const str = 'hello world'
      expect(str.includes('world')).toBe(true)
      expect(str.includes('foo')).toBe(false)
    })

    it('should split strings', () => {
      const str = 'a,b,c'
      const parts = str.split(',')
      expect(parts).toEqual(['a', 'b', 'c'])
    })

    it('should replace strings', () => {
      const str = 'hello world'
      expect(str.replace('world', 'there')).toBe('hello there')
    })
  })

  describe('Array Utilities', () => {
    it('should filter arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      const filtered = arr.filter(x => x > 2)
      expect(filtered).toEqual([3, 4, 5])
    })

    it('should map arrays', () => {
      const arr = [1, 2, 3]
      const mapped = arr.map(x => x * 2)
      expect(mapped).toEqual([2, 4, 6])
    })

    it('should reduce arrays', () => {
      const arr = [1, 2, 3, 4]
      const sum = arr.reduce((acc, val) => acc + val, 0)
      expect(sum).toBe(10)
    })

    it('should check array inclusion', () => {
      const arr = [1, 2, 3]
      expect(arr.includes(2)).toBe(true)
      expect(arr.includes(4)).toBe(false)
    })

    it('should find in arrays', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const found = arr.find(x => x.id === 2)
      expect(found).toEqual({ id: 2 })
    })

    it('should sort arrays', () => {
      const arr = [3, 1, 2]
      const sorted = arr.sort((a, b) => a - b)
      expect(sorted).toEqual([1, 2, 3])
    })
  })

  describe('Object Utilities', () => {
    it('should spread objects', () => {
      const obj1 = { a: 1, b: 2 }
      const obj2 = { b: 3, c: 4 }
      const merged = { ...obj1, ...obj2 }
      expect(merged).toEqual({ a: 1, b: 3, c: 4 })
    })

    it('should get object keys', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const keys = Object.keys(obj)
      expect(keys).toEqual(['a', 'b', 'c'])
    })

    it('should get object values', () => {
      const obj = { a: 1, b: 2, c: 3 }
      const values = Object.values(obj)
      expect(values).toEqual([1, 2, 3])
    })

    it('should get object entries', () => {
      const obj = { a: 1, b: 2 }
      const entries = Object.entries(obj)
      expect(entries).toEqual([['a', 1], ['b', 2]])
    })

    it('should check property existence', () => {
      const obj = { a: 1, b: 2 }
      expect('a' in obj).toBe(true)
      expect('c' in obj).toBe(false)
    })
  })

  describe('Type Checking Utilities', () => {
    it('should check for null/undefined', () => {
      expect(null == undefined).toBe(true)
      expect(null === undefined).toBe(false)
    })

    it('should check for array', () => {
      expect(Array.isArray([])).toBe(true)
      expect(Array.isArray({})).toBe(false)
    })

    it('should check typeof', () => {
      expect(typeof 'string').toBe('string')
      expect(typeof 123).toBe('number')
      expect(typeof true).toBe('boolean')
      expect(typeof {}).toBe('object')
      expect(typeof []).toBe('object')
      expect(typeof null).toBe('object')
      expect(typeof undefined).toBe('undefined')
    })

    it('should check for NaN', () => {
      expect(Number.isNaN(NaN)).toBe(true)
      expect(Number.isNaN(123)).toBe(false)
      expect(Number.isNaN('test')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should throw and catch errors', () => {
      expect(() => {
        throw new Error('Test error')
      }).toThrow('Test error')
    })

    it('should handle try/catch', () => {
      let result
      try {
        throw new Error('Test')
      } catch (error) {
        result = 'caught'
      }
      expect(result).toBe('caught')
    })
  })

  describe('Promise Utilities', () => {
    it('should resolve promises', async () => {
      const promise = Promise.resolve('resolved')
      const result = await promise
      expect(result).toBe('resolved')
    })

    it('should reject promises', async () => {
      const promise = Promise.reject(new Error('rejected'))
      await expect(promise).rejects.toThrow('rejected')
    })

    it('should handle Promise.all', async () => {
      const promises = [
        Promise.resolve(1),
        Promise.resolve(2),
        Promise.resolve(3),
      ]
      const results = await Promise.all(promises)
      expect(results).toEqual([1, 2, 3])
    })
  })
})
