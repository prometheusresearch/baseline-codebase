/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import * as css from '../../css';
import * as stylesheet from '../../stylesheet';
import * as layout from '../../layout';
import StoredFile from './StoredFile';

/**
 * Use this widget to retrieve a stored file.
 */
export default class FileDownload extends React.Component {

  static propTypes = {
    /**
     * The file object to download.
     * The 'name' attribute contains the filename.
     */
    file: React.PropTypes.object,

    /**
     * The application's url for file downloads.
     */
    download: React.PropTypes.string,

    /**
     * The ownerRecordID of the file to download.
     */
    ownerRecordID: React.PropTypes.string
  };

  static stylesheet = stylesheet.create({
    Root: layout.HBox,
    Placeholder: {
      Component: layout.VBox,
      fontSize: '90%',
      color: '#AAAAAA'
    },
    PlaceholderWrapper: {
      Component: layout.VBox,
      flex: 1,
      justifyContent: 'center',
      margin: css.margin(0, 0, 0, 10),
    }
  });

  render() {
    let {file, download, ownerRecordID, ...props} = this.props;
    let {Root, Placeholder, PlaceholderWrapper} = this.constructor.stylesheet;
    return (
      <Root {...props} onChange={undefined} storage={undefined}>
        {file ?
          <StoredFile
            file={{name: file}}
            download={download}
            ownerRecordID={ownerRecordID}
            /> :
          <PlaceholderWrapper>
            <Placeholder>No file uploaded</Placeholder>
          </PlaceholderWrapper>}
      </Root>
    );
  }

}
