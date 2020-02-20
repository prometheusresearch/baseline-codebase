import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import {
  validate,
  GraphQLError,
  GraphQLSchema,
  DocumentNode,
  printError,
  concatAST,
} from "graphql";
import { plugin as generate, Config } from "./index";
import { loadDocuments } from "./loadDocuments";
import { loadSchema } from "./loadSchema";

type EmitError = (error: Error | GraphQLError) => void;

type WebpackLoaderContext = {
  fs: typeof fs;
  emitError: EmitError;
  cacheable: () => void;
  resource: string;
  addDependency: (path: string) => void;
  addContextDependency: (path: string) => void;
  async: () => (err: Error | null, res: string | null) => void;
};

async function process(ctx: WebpackLoaderContext, source: string) {
  ctx.cacheable();

  let { dir, name } = path.parse(ctx.resource);
  let docsPath = path.join(dir, name);
  let schemaPath = path.join(dir, name, "schema.gql");

  ctx.addDependency(schemaPath);
  ctx.addContextDependency(docsPath);

  let schema = await loadSchema(schemaPath, ctx.fs);
  let docs = await loadDocuments(docsPath, ctx.fs);

  if (!validateDocuments(schema, docs, ctx.emitError)) {
    return null;
  }

  let outputFile = path.join(dir, `${name}.js.flow`);
  let result = generate(schema, docs, getConfig(source), { outputFile });

  // Format with prettier
  let prettierConfig = await prettier.resolveConfig(outputFile);
  result = await prettier.format(result, {
    ...prettierConfig,
    filepath: outputFile,
  });

  // Write ctx for flow
  fs.writeFileSync(outputFile, result, "utf8");

  return result;
}

function getConfig(source: string): Config {
  let parser = /(?:@)(\w+) (.+?)\n/g;
  let config: Config = {};
  let m: RegExpExecArray;
  while ((m = parser.exec(source)) != null) {
    let key = m[1];
    let value = key === "generateUnions" ? m[2] === "true" : m[2];
    config[key] = value;
  }
  return config;
}

function validateDocuments(
  schema: GraphQLSchema,
  docs: DocumentNode[],
  emitError: EmitError,
): boolean {
  let isValid = true;
  let doc = concatAST(docs);
  validate(schema, doc).forEach(error => {
    isValid = false;
    emitError(new Error(printError(error)));
  });
  return isValid;
}

export default function rexGraphqlCodegen(this: WebpackLoaderContext, source) {
  let cb = this.async();
  process(this, source).then(
    (res: string) => cb(null, res),
    (err: Error) => cb(err, null),
  );
}
