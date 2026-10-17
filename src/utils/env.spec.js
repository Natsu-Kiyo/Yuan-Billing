import { describe, it, expect, afterEach, vi } from 'vitest'
import { getMissingEnvKeys } from './env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('getMissingEnvKeys', () => {
  it('配置齐全时返回空数组', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

    expect(getMissingEnvKeys()).toEqual([])
  })

  it('报告缺失的变量名', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    expect(getMissingEnvKeys()).toEqual(['VITE_SUPABASE_ANON_KEY'])
  })
})
