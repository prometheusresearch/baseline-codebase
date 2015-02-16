/**
 * @jsx React.DOM
 */

'use strict';

var React        = require('react');
var log          = require('./log');
var resourcer    = require('./resourcer');
var localization = require('./localization');
var _            = localization._;


var MIME_TYPES = [
  {
    pattern: /\.mp3$/,
    mimeType: 'audio/mpeg'
  },
  {
    pattern: /\.ogg$/,
    mimeType: 'audio/ogg'
  },
  {
    pattern: /\.wav$/,
    mimeType: 'audio/x-wav'
  },
  {
    pattern: /\.(au|snd)$/,
    mimeType: 'audio/basic'
  },
  {
    pattern: /\.aif(c|f)?$/,
    mimeType: 'audio/x-aiff'
  }
];

function getMimeTypeForName(fileName) {
  for (var i = 0; i < MIME_TYPES.length; i++) {
    if (fileName.match(MIME_TYPES[i].pattern)) {
      return MIME_TYPES[i].mimeType;
    }
  }
}


var AUDIO_SUPPORTED = !!document.createElement('audio').canPlayType;

var AudioPlayer;

if (!AUDIO_SUPPORTED) {

  log('AudioPlayer functionality not supported in this browser.');

  AudioPlayer = React.createClass({
    render: function () {
      return (<div className="rex-forms-AudioPlayer__notsupported" />);
    }
  });

} else {

  AudioPlayer = React.createClass({
    mixins: [
      localization.LocalizedMixin,
      resourcer.ResourcedMixin
    ],

    propTypes: {
      source: React.PropTypes.object.isRequired,
      showDuration: React.PropTypes.bool,
      showRestart: React.PropTypes.bool
    },

    getDefaultProps: function () {
      return {
        showDuration: true,
        showRestart: true
      };
    },

    getInitialState: function () {
      return {
        playing: false
      };
    },

    getAudio: function () {
      return this.refs.audio ? this.refs.audio.getDOMNode() : null;
    },

    componentDidMount: function () {
      var audio = this.getAudio();

      audio.addEventListener('playing', () => {
        this.setState({
          playing: true
        });
      });
      audio.addEventListener('pause', () => {
        this.setState({
          playing: false
        });
      });
      audio.addEventListener('ended', () => {
        this.setState({
          playing: false
        });
      });
      audio.addEventListener('loadedmetadata', () => {
        this.forceUpdate();
      });

      var updaterInterval = setInterval(() => {
        if (this.state.playing) {
          this.forceUpdate();
        }
      }, 333);
      this.setState({
        updaterInterval: updaterInterval
      });
    },

    componentWillUnmount: function () {
      if (this.updaterInterval) {
        clearInterval(this.updaterInterval);
      }
    },

    buildSources: function (source) {
      source = source || this.props.source;

      var localSources = this.localize(this.props.source) || [];

      return localSources.map((source, idx) => {
        return (
          <source
            key={idx}
            src={this.getResourceUrl(source)}
            type={getMimeTypeForName(source)}
            />
        );
      });
    },

    onPlayPause: function (event) {
      event.preventDefault();
      var audio = this.getAudio();
      if (this.state.playing) {
        audio.pause();
      } else {
        audio.play();
      }
    },

    onRestart: function (event) {
      event.preventDefault();
      var audio = this.getAudio();
      audio.currentTime = 0;
      if (!this.state.playing) {
        audio.play();
      }
    },

    formatTime: function (totalSeconds) {
      var minutes = parseInt(totalSeconds / 60);
      if (minutes < 10) {
        minutes = '0' + minutes;
      }

      var seconds = parseInt(totalSeconds % 60);
      if (seconds < 10) {
        seconds = '0' + seconds;
      }

      return minutes + ':' + seconds;
    },

    render: function () {
      var audio = this.getAudio();

      var sources = this.buildSources(this.props.source);
      if (sources.length === 0) {
        return (<div />);
      }

      var position, duration, blah;
      if (this.props.showDuration && audio && audio.duration) {
        position = this.formatTime(audio.currentTime);
        duration = this.formatTime(audio.duration);
        blah = position + ' / ' + duration;
      }


      return (
        <div className="rex-forms-AudioPlayer">
          <audio preload="metadata" ref="audio">
            {sources}
          </audio>
          <div className="rex-forms-AudioPlayerControls btn-group">
            <a className="btn btn-default" onClick={this.onPlayPause}>
              {!this.state.playing &&
                <span
                  title={_('Play the Recording')}
                  className="icon-play">
                </span>
              }
              {this.state.playing &&
                <span
                  title={_('Pause the Recording')}
                  className="icon-pause">
                </span>
              }
            </a>
            {this.props.showDuration &&
              <div className="btn btn-default">
                <span>{blah || '???'}</span>
              </div>
            }
            {this.props.showRestart &&
              <a className="btn btn-default" onClick={this.onRestart}>
                <span
                  title={_('Restart the Recording')}
                  className="icon-restart">
                </span>
              </a>
            }
          </div>
        </div>
      );
    }
  });

}


module.exports = AudioPlayer;

