/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as css from "../CSS";
import { VBox, HBox } from "react-stylesheet";
import StoredFile from "./StoredFile";
import { type FileValue } from "./File";

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
  ownerRecordID: string
};

/**
 * Use this widget to retrieve a stored file.
 */
export default function FileDownload(props: Props) {
  let { file, download, ownerRecordID } = props;
  return (
    <HBox>
      {file ? (
        <StoredFile
          file={file}
          download={download}
          ownerRecordID={ownerRecordID}
        />
      ) : (
        <VBox flexGrow={1} justifyContent="center">
          <VBox fontSize="90%">No file uploaded</VBox>
        </VBox>
      )}
    </HBox>
  );
}
