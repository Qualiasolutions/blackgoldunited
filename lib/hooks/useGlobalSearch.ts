import { useState, useEffect } from 'react'

export interface SearchResult {
  id: string
  type: 'client' | 'invoice' | 'product' | 'purchase_order' | 'supplier'
  title: string
  description: string
  module: string
  href: string
  match: string
  priority: number
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  total: number
}

export function useGlobalSearch() {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const search = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: SearchResponse = await response.json()
      setResults(data.results)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setResults([])
    setQuery('')
    setError(null)
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== '') {
        search(query)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, search])

  return {
    results,
    loading,
    error,
    query,
    setQuery,
    search,
    clearSearch
  }
}