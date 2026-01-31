import { Fs } from "@d0paminedriven/fs";

const fs = new Fs(process.cwd());
// const absPath = resolve("../../../../.vscode/settings.json")
const _sets = fs.fileToBuffer(`templated.sh`).toString("utf-8");

const exampleWorkspace = "demo";
const _replaced = _sets.replaceAll(/\{WORKSPACE\}/g, exampleWorkspace);
async function ttt() {
  return await fetch(
    "https://raw.githubusercontent.com/DopamineDriven/wallet-ledger-demo/refs/heads/main/manage.sh",
    {
      method: "GET"
    }
  ).then(async v => {
    const myT = await v.text();
    const replaceIt = myT.replace(
      /(build_order=\(([\s\S]*?)\))/g,
      `build_order=(
      "@${exampleWorkspace}/ui"
    )`
    );
    return replaceIt;
  });
}

"".replaceAll("","")
ttt().then((o)=>{
fs.withWs("src/test/__out__/test-shell-script-remote.sh", o);
})

