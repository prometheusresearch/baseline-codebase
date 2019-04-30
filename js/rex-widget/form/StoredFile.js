/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import File, { type FileValue } from "./File";

type Props = {
  /**
   * The file object to download.
   * The 'name' attribute contains the filename.
   */
  file: FileValue,

  /**
   * The application's url for file downloads.
   */
  download: string,

  /**
   * The ownerRecordID of the file to download.
   */
  ownerRecordID: string,

  onRemove?: () => void
};

/**
 * Renders a <File> widget with an anchor <a> whose ``href``
 * downloads the file.
 */
export default function StoredFile(props: Props) {
  let { download, file, ownerRecordID, onRemove } = props;
  let href = `${download}?${ownerRecordID}`;
  let storedFile = { ...file, name: filename(file), href };
  return <File file={storedFile} onRemove={onRemove} />;
}

const CLEAN_FILENAME_RE = /.*\/([^\/]+)$/i;
const UNQUOTE_BEGIN_RE = /^'/;
const UNQUOTE_END_RE = /'$/;

function filename(file) {
  let result = unquote(file.name);
  return result.replace(CLEAN_FILENAME_RE, "$1");
}

function unquote(str) {
  return str.replace(UNQUOTE_BEGIN_RE, "").replace(UNQUOTE_END_RE, "");
}
