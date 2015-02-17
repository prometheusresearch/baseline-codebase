/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React       = require('react/addons');
var merge       = require('../merge');
var Hoverable   = require('../Hoverable');
var Icon        = require('../Icon');
var {Box, HBox} = require('../layout');

var Progress = React.createClass({

  style: {
    height: 2,
    background: 'rgb(142, 142, 226)'
  },

  render() {
    var {progress, style, ...props} = this.props;
    progress = progress || 0;
    var style = merge(this.style, style, {
      width: `${progress * 100}%`
    });
    return <Box {...props} style={style} />;
  }
});

var File = React.createClass({
  mixins: [Hoverable],

  style: {
    fontSize: '90%',
    cursor: 'pointer',
    top: 2
  },

  styleIcon: {
    marginRight: 5,
    marginLeft: 5,
    top: -2
  },

  render() {
    var {file, icon, required, children, onRemove, progress, ...props} = this.props;
    var {hover} = this.state;
    return (
      <Box {...props}>
        <HBox
          {...this.hoverable}
          size={1}
          style={this.style}
          onClick={!required && !progress && onRemove}>
          <Box centerVertically style={this.styleIcon}>
            {icon ?
              <Icon name={icon} /> :
              progress ?
              <Icon name="repeat" /> :
              required || !hover ?
              <Icon name="ok" /> :
              <Icon name="remove" />}
          </Box>
          <Box centerVertically>
            {progress || required || !hover ?
              children || file.name :
              'Remove file'}
          </Box>
        </HBox>
        <Progress progress={progress} />
      </Box>
    );
  }
});

var StoredFile = React.createClass({

  render() {
    var {download, file, ownerRecordID, ...props} = this.props;
    return (
      <File icon="download" required {...props} file={file}>
        <a href={`${download}?${ownerRecordID}`}>
          {filename(file)}
        </a>
      </File>
    );
  }
});


function filename(file) {
  var result = unquote(file.name);
  return result.replace(/.*\/([^\/]+)$/i, '$1');
}

function unquote(str) {
  return str.replace(/^'/, '').replace(/'$/, '');
}

module.exports = File;
module.exports.File = File;
module.exports.StoredFile = StoredFile;
