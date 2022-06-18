import { copyFileSync, constants } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

copyFileSync(
  path.resolve(__dirname, "../src/types.ts"),
  path.resolve(__dirname, "../types/types.d.ts"),
  constants.COPYFILE_FICLONE
)