import {ConfigHandler} from "@/config/index.ts";


const c = new ConfigHandler(process.cwd());
async function sss () {
  const file = await c.resolveCentralCatalog()
  c.withWs("src/test/__out__/populated-file.yaml", file)
}

sss();
