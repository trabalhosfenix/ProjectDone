import path from 'path'

export function resolveUploadPath(filename: string): string | null {
  const raw = String(filename || '').trim()
  if (!raw || raw === 'uploads') return null

  const decoded = decodeURIComponent(raw)
  const basename = path.basename(decoded)
  if (basename !== decoded) return null

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads')
  const filePath = path.resolve(uploadsDir, basename)
  if (!filePath.startsWith(`${uploadsDir}${path.sep}`)) return null

  return filePath
}

