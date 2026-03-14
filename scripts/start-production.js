const fsModule = import('node:fs')
const pathModule = import('node:path')
const childProcessModule = import('node:child_process')
const urlModule = import('node:url')

async function main() {
  const [{ default: fs }, { default: path }, { spawnSync }, { pathToFileURL }] =
    await Promise.all([fsModule, pathModule, childProcessModule, urlModule])

  const rootDir = path.resolve(__dirname, '..')
  const standaloneServer = path.join(rootDir, '.next', 'standalone', 'server.js')

  if (!fs.existsSync(standaloneServer)) {
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const build = spawnSync(npmCommand, ['run', 'build'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    })

    if (build.status !== 0) {
      process.exit(build.status ?? 1)
    }
  }

  await import(pathToFileURL(standaloneServer).href)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
