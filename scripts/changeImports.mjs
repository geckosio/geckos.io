import { readFile, writeFile } from 'fs/promises'
import { argv } from 'process'


const args = argv.splice(2)
const arg0 = args[0]

const path = "./packages/server/src/deps.ts"



let file = await readFile(path, { encoding: "utf-8" })
if (arg0 === "--reverse") {
  file = file.replace(/common\/cjs/gm, "common/lib")
}
else {
  file = file.replace(/common\/lib/gm, "common/cjs")
}
await writeFile(path, file, { encoding: 'utf-8' })

