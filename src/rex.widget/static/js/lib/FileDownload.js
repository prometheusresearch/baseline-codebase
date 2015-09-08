/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var File                = require('./File');
var StoredFile          = require('./StoredFile');
var Layout              = require('./Layout');

var FileDownloadStyle =  {
  placeholder: {
    fontSize: '90%',
    color: '#AAAAAA'
  }
};

var FileDownload = React.createClass({

  render() {
    var {file, download, ownerRecordID, ...props} = this.props;
    return (
      <Layout.HBox {...props} onChange={undefined} storage={undefined}>
        {file ?
          <StoredFile
            file={{name: file}}
            download={download}
            ownerRecordID={ownerRecordID}
            /> :
          <Layout.VBox centerVertically margin="0 0 0 10px" size={1}>
            <Layout.VBox style={FileDownloadStyle.placeholder}>No file uploaded</Layout.VBox>
          </Layout.VBox>}
      </Layout.HBox>
    );
  }

});

module.exports = FileDownload;
