import * as fs from "fs";
import * as path from "path";
import { DocumentNode, parse, Source } from "graphql";
import promisifyWithContext from "./promisifyWithContext";

type FS = typeof fs;

export async function loadDocuments(
  dir: string,
  fs: FS,
): Promise<DocumentNode[]> {
  let readdir = promisifyWithContext(fs.readdir, fs);
  let readFile = promisifyWithContext(fs.readFile, fs);
  let stat = promisifyWithContext(fs.stat, fs);

  let names = await readdir(dir);
  names = names.filter((name: string) => isGraphQL.test(name));

  let docs: (DocumentNode | null)[] = await Promise.all(
    names.map(async (name: string) => {
      // schema.gql contains dumped schema
      if (name == "schema.gql") {
        return null;
      }
      let filename = path.join(dir, name);
      let filenameStat = await stat(filename);
      if (!filenameStat.isFile()) {
        return null;
      } else {
        let data = await readFile(filename);
        data = data.toString();
        let document: DocumentNode = parse(new Source(data, filename));
        return document;
      }
    }),
  );

  return docs.filter(doc => doc != null) as DocumentNode[];
}

let isGraphQL = /^\w+\.gql$/;
