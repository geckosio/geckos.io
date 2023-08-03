import { writeFile } from 'fs/promises'

const pkgModule = {
  type: 'module'
}

const pkgCommonjs = {
  type: 'commonjs'
}

await writeFile('./packages/server/lib/package.json', JSON.stringify(pkgModule, null, 2), { encoding: 'utf-8' }).catch(() => { })
await writeFile('./packages/server/cjs/package.json', JSON.stringify(pkgCommonjs, null, 2), { encoding: 'utf-8' }).catch(() => { })

await writeFile('./packages/common/lib/package.json', JSON.stringify(pkgModule, null, 2), { encoding: 'utf-8' }).catch(() => { })
await writeFile('./packages/common/cjs/package.json', JSON.stringify(pkgCommonjs, null, 2), { encoding: 'utf-8' }).catch(() => { })