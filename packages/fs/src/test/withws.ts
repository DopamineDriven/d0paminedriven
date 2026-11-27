import { Fs } from "@/index.ts";

const fs = new Fs(process.cwd());

fs.withWs("src/test/__out__/test-1-2-3.txt", "testing 1,2,3");
