import * as fs from "fs";
import { GraphQLSchema, Source, buildSchema } from "graphql";
import promisifyWithContext from "./promisifyWithContext";

type FS = typeof fs;

export async function loadSchema(
  filename: string,
  fs: FS,
): Promise<GraphQLSchema> {
  let readFile = promisifyWithContext(fs.readFile, fs);
  let data = await readFile(filename);
  let src = new Source(data.toString(), filename);
  return buildSchema(src);
}
