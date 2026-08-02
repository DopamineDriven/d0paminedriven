import {parse, } from "yaml";
import {Fs} from "@d0paminedriven/fs";

const fs = new Fs(process.cwd());

const getFile = fs.fileToBuffer("src/test/__out__/catalog-example.yaml").toString('utf-8');

const x = parse(getFile) as unknown

console.log(x);