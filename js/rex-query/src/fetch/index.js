/**
 * @flow
 */

import type { TranslateOptions } from "./translate";
import type { Query, Domain, ExportFormat } from "../model/types";
import type { Catalog } from "../model/RexQueryCatalog";

import download from "downloadjs";

import { toDomain } from "../model/RexQueryCatalog";
import translate from "./translate";

function fetchJSON(api: string, data: mixed): Promise<Object> {
  return window
    .fetch(api, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(async response => {
      // check for HTTP status to be 2xx
      if (Math.floor(response.status / 100) !== 2) {
        let text = await response.text();
        throw new Error(text);
      } else {
        let json = await response.json();
        return json;
      }
    });
}

export function initiateDownloadFromBlob(
  blob: string | Blob,
  filename: string,
  mimetype: string
): void {
  download(blob, filename, mimetype);
}

export function initiateDownload(
  api: string,
  query: Query,
  options: TranslateOptions,
  format: ExportFormat
): Promise<Blob> {
  return window
    .fetch(api, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: format.mimetype,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(translate(query, options))
    })
    .then(response => response.blob())
    .then(blob => download(blob, `query.${format.extension}`, format.mimetype));
}

export function fetch(
  api: string,
  query: Query,
  options: TranslateOptions
): Promise<Object> {
  return fetchJSON(api, translate(query, options));
}

export function fetchCatalog(api: string): Promise<Domain> {
  return fetchJSON(api, ["catalog"]).then(data => {
    let catalog: Catalog = data;
    return toDomain(catalog);
  });
}
