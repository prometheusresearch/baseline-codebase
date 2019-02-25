/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";

import PlayIcon from "react-icons/lib/fa/play";
import PauseIcon from "react-icons/lib/fa/pause";
import BackwardIcon from "react-icons/lib/fa/backward";

import { InjectI18N } from "rex-i18n";

const AUDIO_SUPPORTED = !!document.createElement("audio").canPlayType;

const MIME_TYPES = [
  {
    pattern: /\.mp3$/,
    mimeType: "audio/mpeg"
  },
  {
    pattern: /\.ogg$/,
    mimeType: "audio/ogg"
  },
  {
    pattern: /\.wav$/,
    mimeType: "audio/x-wav"
  },
  {
    pattern: /\.(au|snd)$/,
    mimeType: "audio/basic"
  },
  {
    pattern: /\.aif(c|f)?$/,
    mimeType: "audio/x-aiff"
  }
];

export default InjectI18N(
  class AudioPlayer extends React.Component {
    static propTypes = {
      source: React.PropTypes.array.isRequired,
      showDuration: React.PropTypes.bool,
      showRestart: React.PropTypes.bool,
      durationUpdateInterval: React.PropTypes.number
    };

    static defaultProps = {
      showDuration: false,
      showRestart: true,
      durationUpdateInterval: 333
    };

    constructor(props) {
      super(props);
      this._updaterInterval = null;
      this._audio = null;
      this.state = {
        playing: false,
        position: null,
        duration: null
      };
    }

    onAudioPlaying = () => {
      this.setState({ playing: true });
    };

    onAudioPause = () => {
      this.setState({ playing: false });
    };

    onAudioEnded = () => {
      this.setState({ playing: false });
    };

    onAudioMetadata = () => {
      let position = formatTime(this._audio.currentTime);
      let duration = formatTime(this._audio.duration);
      this.setState({ position, duration });
      this.forceUpdate();
    };

    onAudioRef = audio => {
      this._audio = audio;
    };

    onAudioDuration = () => {
      if (this.state.playing && this.props.durationUpdateInterval) {
        let position = formatTime(this._audio.currentTime);
        let duration = formatTime(this._audio.duration);
        this.setState({ position, duration });
      }
    };

    onPlay = event => {
      event.stopPropagation();
      this.setState({ playing: true });
      this._audio.play();
    };

    onPause = event => {
      event.stopPropagation();
      this.setState({ playing: false });
      this._audio.pause();
    };

    onRestart = event => {
      event.stopPropagation();
      this._audio.currentTime = 0;
      if (!this.state.playing) {
        this._audio.play();
      }
    };

    render() {
      if (!AUDIO_SUPPORTED) {
        return <div>{this._("Audio is not supported by this browser.")}</div>;
      }

      let { showDuration, showRestart, source, disabled } = this.props;
      let { playing, position, duration } = this.state;

      if (source.length === 0) {
        return <div />;
      }

      let sourceElements = source.map((source, idx) => (
        <source key={idx} src={source} type={getMimeTypeForName(source)} />
      ));

      let durationDisplay =
        showDuration && duration ? position + " / " + duration : "???";

      return (
        <ReactUI.Block inline>
          <audio preload="metadata" ref={this.onAudioRef}>
            {sourceElements}
          </audio>
          <ReactUI.Block inline verticalAlign="middle">
            {!playing ? (
              <ReactUI.FlatButton
                onClick={this.onPlay}
                disabled={disabled}
                groupHorizontally={showRestart}
                title={this._("Play")}
                size="small"
                icon={<PlayIcon />}
              />
            ) : (
              <ReactUI.FlatButton
                onClick={this.onPause}
                disabled={disabled}
                groupHorizontally={showRestart}
                title={this._("Pause")}
                size="small"
                icon={<PauseIcon />}
              />
            )}
            {showDuration && (
              <ReactUI.FlatButton
                groupHorizontally={showRestart}
                disabled={disabled}
                size="small"
              >
                {durationDisplay}
              </ReactUI.FlatButton>
            )}
            {showRestart && (
              <ReactUI.FlatButton
                onClick={this.onRestart}
                disabled={disabled}
                groupHorizontally={showRestart}
                title={this._("Restart the Recording")}
                size="small"
                icon={<BackwardIcon />}
              />
            )}
          </ReactUI.Block>
        </ReactUI.Block>
      );
    }

    componentDidMount() {
      if (!this._audio) {
        return;
      }

      this._updaterInterval = setInterval(
        this.onAudioDuration,
        this.props.durationUpdateInterval
      );
      this._audio.addEventListener("playing", this.onAudioPlaying);
      this._audio.addEventListener("pause", this.onAudioPause);
      this._audio.addEventListener("ended", this.onAudioEnded);
      this._audio.addEventListener("loadedmetadata", this.onAudioMetadata);
    }

    componentWillUnmount() {
      if (!this._audio) {
        return;
      }

      clearInterval(this._updaterInterval);

      this._audio.removeEventListener("playing", this.onAudioPlaying);
      this._audio.removeEventListener("pause", this.onAudioPause);
      this._audio.removeEventListener("ended", this.onAudioEnded);
      this._audio.removeEventListener("loadedmetadata", this.onAudioMetadata);
    }
  }
);

function getMimeTypeForName(fileName) {
  for (let i = 0; i < MIME_TYPES.length; i++) {
    if (fileName.match(MIME_TYPES[i].pattern)) {
      return MIME_TYPES[i].mimeType;
    }
  }
}

function formatTime(totalSeconds) {
  let minutes = parseInt(totalSeconds / 60);
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  let seconds = parseInt(totalSeconds % 60);
  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return minutes + ":" + seconds;
}
