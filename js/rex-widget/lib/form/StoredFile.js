/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import File from './File';

/**
 * Renders a <File> widget with an anchor <a> whose ``href``
 * downloads the file.
 */
export default class StoredFile extends React.Component {

  static propTypes = {
    /**
     * The file object to download.
     * The 'name' attribute contains the filename.
     */
    file: PropTypes.object,

    /**
     * The application's url for file downloads.
     */
    download: PropTypes.string,

    /**
     * The ownerRecordID of the file to download.
     */
    ownerRecordID: PropTypes.string
  };

  render() {
    let {download, file, ownerRecordID, ...props} = this.props;
    return (
      <File icon="download" required {...props} file={file}>
        <a href={`${download}?${ownerRecordID}`}>
          {filename(file)}
        </a>
      </File>
    );
  }
}

const CLEAN_FILENAME_RE = /.*\/([^\/]+)$/i;
const UNQUOTE_BEGIN_RE  = /^'/;
const UNQUOTE_END_RE    = /'$/;

function filename(file) {
  let result = unquote(file.name);
  return result.replace(CLEAN_FILENAME_RE, '$1');
}

function unquote(str) {
  return str.replace(UNQUOTE_BEGIN_RE, '').replace(UNQUOTE_END_RE, '');
}

