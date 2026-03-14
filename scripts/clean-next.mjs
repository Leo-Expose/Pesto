import { rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')

const targets = [
  '.next/server/middleware.js',
  '.next/server/middleware.js.nft.json',
  '.next/server/middleware-manifest.json',
  '.next/server/middleware-react-loadable-manifest.js',
  '.next/server/middleware-build-manifest.js',
  '.next/dev/server/middleware-manifest.json',
  '.next/dev/server/middleware-react-loadable-manifest.js',
  '.next/dev/server/middleware-build-manifest.js',
]

await Promise.all(
  targets.map((target) =>
    rm(path.join(rootDir, target), {
      force: true,
      recursive: false,
    })
  )
)
