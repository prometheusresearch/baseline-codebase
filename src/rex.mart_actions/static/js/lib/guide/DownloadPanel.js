/**
 * @copyright 2017, Prometheus Research, LLC
 */

import React from 'react';

import * as ReactUI from '@prometheusresearch/react-ui';
import {VBox} from 'react-stylesheet';
import download from 'downloadjs';

import ScrollablePanel from './ScrollablePanel';


export default class DownloadPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      downloading: false,
    };
  }

  onDownload(exporter) {
    let exp = this.props.exporters.filter((e) => e.name === exporter)[0];

    this.setState(
      {downloading: true},
      () => {
        this.props.retriever(exp.mime_type)
          .then((response) => {
            return response.blob();
          })
          .then((blob) => {
            download(blob, 'data.' + exp.name, exp.mime_type);
          })
          .then(() => {
            this.setState({downloading: false});
          })
          .catch((err) => {
            this.setState({downloading: false});
            throw err;
          });
      },
    );
  }

  render() {
    let {exporters} = this.props;
    let {downloading} = this.state;

    return (
      <ScrollablePanel>
        <VBox
          style={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            cursor: downloading ? 'wait' : 'auto',
          }}>
          {exporters.map((exp, idx) => {
            return (
              <ReactUI.FlatButton
                onClick={this.onDownload.bind(this, exp.name)}
                style={{
                  marginBottom: '1em',
                  display: 'block',
                  cursor: downloading ? 'wait' : 'auto',
                }}
                disabled={downloading}
                key={idx}>
                {exp.title}
              </ReactUI.FlatButton>
            );
          })}
        </VBox>
      </ScrollablePanel>
    );
  }
}

