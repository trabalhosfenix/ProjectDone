import { describe, expect, it } from 'vitest'
import { resolveUploadPath } from '@/lib/upload-path'

describe('resolveUploadPath', () => {
  it('aceita um nome de arquivo simples', () => {
    const resolved = resolveUploadPath('report.pdf')
    expect(resolved).toContain('/public/uploads/report.pdf')
  })

  it('bloqueia path traversal com ../', () => {
    expect(resolveUploadPath('../.env')).toBeNull()
    expect(resolveUploadPath('..%2F.env')).toBeNull()
  })

  it('bloqueia subpastas injetadas', () => {
    expect(resolveUploadPath('nested/file.png')).toBeNull()
  })
})

