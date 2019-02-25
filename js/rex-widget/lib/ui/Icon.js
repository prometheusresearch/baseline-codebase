/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from "react";

let CACHE = {};
function load(icon) {
  if(CACHE[icon]) {
    return CACHE[icon];
  }
  switch (icon) {
    case "asterisk":
      return import("react-icons/lib/fa/asterisk");
    case "plus":
      return import("react-icons/lib/fa/plus");
    case "euro":
      return import("react-icons/lib/fa/eur");
    case "eur":
      return import("react-icons/lib/fa/eur");
    case "minus":
      return import("react-icons/lib/fa/minus");
    case "cloud":
      return import("react-icons/lib/fa/cloud");
    case "envelope":
      return import("react-icons/lib/fa/envelope");
    case "pencil":
      return import("react-icons/lib/fa/pencil");
    case "glass":
      return import("react-icons/lib/fa/glass");
    case "music":
      return import("react-icons/lib/fa/music");
    case "search":
      return import("react-icons/lib/fa/search");
    case "heart":
      return import("react-icons/lib/fa/heart");
    case "star":
      return import("react-icons/lib/fa/star");
    case "star-empty":
      return import("react-icons/lib/fa/star-o");
    case "user":
      return import("react-icons/lib/fa/user");
    case "film":
      return import("react-icons/lib/fa/film");
    case "th-large":
      return import("react-icons/lib/fa/th-large");
    case "th":
      return import("react-icons/lib/fa/th");
    case "th-list":
      return import("react-icons/lib/fa/th-list");
    case "ok":
      return import("react-icons/lib/fa/check");
    case "remove":
      return import("react-icons/lib/fa/times-circle");
    case "zoom-in":
      return import("react-icons/lib/fa/search-plus");
    case "zoom-out":
      return import("react-icons/lib/fa/search-minus");
    case "off":
      return import("react-icons/lib/fa/power-off");
    case "signal":
      return import("react-icons/lib/fa/signal");
    case "cog":
      return import("react-icons/lib/fa/cog");
    case "trash":
      return import("react-icons/lib/fa/trash");
    case "home":
      return import("react-icons/lib/fa/home");
    case "file":
      return import("react-icons/lib/fa/file");
    case "time":
      return import("react-icons/lib/fa/clock-o");
    case "road":
      return import("react-icons/lib/fa/road");
    case "download-alt":
      return import("react-icons/lib/fa/download");
    case "download":
      return import("react-icons/lib/fa/download");
    case "upload":
      return import("react-icons/lib/fa/upload");
    case "inbox":
      return import("react-icons/lib/fa/inbox");
    case "play-circle":
      return import("react-icons/lib/fa/play-circle-o");
    case "repeat":
      return import("react-icons/lib/fa/repeat");
    case "refresh":
      return import("react-icons/lib/fa/refresh");
    case "list-alt":
      return import("react-icons/lib/fa/list-alt");
    case "lock":
      return import("react-icons/lib/fa/lock");
    case "flag":
      return import("react-icons/lib/fa/flag");
    case "headphones":
      return import("react-icons/lib/fa/heart");
    case "volume-off":
      return import("react-icons/lib/fa/volume-off");
    case "volume-down":
      return import("react-icons/lib/fa/volume-down");
    case "volume-up":
      return import("react-icons/lib/fa/volume-up");
    case "qrcode":
      return import("react-icons/lib/fa/qrcode");
    case "barcode":
      return import("react-icons/lib/fa/barcode");
    case "tag":
      return import("react-icons/lib/fa/tag");
    case "tags":
      return import("react-icons/lib/fa/tags");
    case "book":
      return import("react-icons/lib/fa/book");
    case "bookmark":
      return import("react-icons/lib/fa/bookmark");
    case "print":
      return import("react-icons/lib/fa/print");
    case "camera":
      return import("react-icons/lib/fa/camera");
    case "font":
      return import("react-icons/lib/fa/font");
    case "bold":
      return import("react-icons/lib/fa/bold");
    case "italic":
      return import("react-icons/lib/fa/italic");
    case "text-height":
      return import("react-icons/lib/fa/text-height");
    case "text-width":
      return import("react-icons/lib/fa/text-width");
    case "align-left":
      return import("react-icons/lib/fa/align-left");
    case "align-center":
      return import("react-icons/lib/fa/align-center");
    case "align-right":
      return import("react-icons/lib/fa/align-right");
    case "align-justify":
      return import("react-icons/lib/fa/align-justify");
    case "list":
      return import("react-icons/lib/fa/list");
    case "indent-left":
      return import("react-icons/lib/fa/indent");
    case "indent-right":
      return import("react-icons/lib/fa/indent");
    case "facetime-video":
      return import("react-icons/lib/fa/video-camera");
    case "picture":
      return import("react-icons/lib/fa/image");
    case "map-marker":
      return import("react-icons/lib/fa/map-marker");
    case "adjust":
      return import("react-icons/lib/fa/adjust");
    case "tint":
      return import("react-icons/lib/fa/tint");
    case "edit":
      return import("react-icons/lib/fa/pencil-square");
    case "share":
      return import("react-icons/lib/fa/share-square-o");
    case "check":
      return import("react-icons/lib/fa/check-square-o");
    case "move":
      return import("react-icons/lib/fa/arrows");
    case "step-backward":
      return import("react-icons/lib/fa/step-backward");
    case "fast-backward":
      return import("react-icons/lib/fa/fast-backward");
    case "backward":
      return import("react-icons/lib/fa/backward");
    case "play":
      return import("react-icons/lib/fa/play");
    case "pause":
      return import("react-icons/lib/fa/pause");
    case "stop":
      return import("react-icons/lib/fa/stop");
    case "forward":
      return import("react-icons/lib/fa/forward");
    case "fast-forward":
      return import("react-icons/lib/fa/fast-forward");
    case "step-forward":
      return import("react-icons/lib/fa/step-forward");
    case "eject":
      return import("react-icons/lib/fa/eject");
    case "chevron-left":
      return import("react-icons/lib/fa/chevron-left");
    case "chevron-right":
      return import("react-icons/lib/fa/chevron-right");
    case "plus-sign":
      return import("react-icons/lib/fa/plus-circle");
    case "minus-sign":
      return import("react-icons/lib/fa/minus-circle");
    case "remove-sign":
      return import("react-icons/lib/fa/times-circle");
    case "ok-sign":
      return import("react-icons/lib/fa/check-circle");
    case "question-sign":
      return import("react-icons/lib/fa/question-circle");
    case "info-sign":
      return import("react-icons/lib/fa/info-circle");
    case "screenshot":
      return import("react-icons/lib/fa/dot-circle-o");
    case "remove-circle":
      return import("react-icons/lib/fa/times-circle-o");
    case "ok-circle":
      return import("react-icons/lib/fa/check-circle-o");
    case "ban-circle":
      return import("react-icons/lib/fa/ban");
    case "arrow-left":
      return import("react-icons/lib/fa/arrow-left");
    case "arrow-right":
      return import("react-icons/lib/fa/arrow-right");
    case "arrow-up":
      return import("react-icons/lib/fa/arrow-up");
    case "arrow-down":
      return import("react-icons/lib/fa/arrow-down");
    case "share-alt":
      return import("react-icons/lib/fa/share-alt");
    case "resize-full":
      return import("react-icons/lib/fa/expand");
    case "resize-small":
      return import("react-icons/lib/fa/compress");
    case "exclamation-sign":
      return import("react-icons/lib/fa/exclamation-circle");
    case "gift":
      return import("react-icons/lib/fa/gift");
    case "leaf":
      return import("react-icons/lib/fa/leaf");
    case "fire":
      return import("react-icons/lib/fa/fire");
    case "eye-open":
      return import("react-icons/lib/fa/eye");
    case "eye-close":
      return import("react-icons/lib/fa/eye-slash");
    case "warning-sign":
      return import("react-icons/lib/fa/exclamation-circle");
    case "plane":
      return import("react-icons/lib/fa/plane");
    case "calendar":
      return import("react-icons/lib/fa/calendar");
    case "random":
      return import("react-icons/lib/fa/random");
    case "comment":
      return import("react-icons/lib/fa/comment");
    case "magnet":
      return import("react-icons/lib/fa/magnet");
    case "chevron-up":
      return import("react-icons/lib/fa/chevron-up");
    case "chevron-down":
      return import("react-icons/lib/fa/chevron-down");
    case "retweet":
      return import("react-icons/lib/fa/retweet");
    case "shopping-cart":
      return import("react-icons/lib/fa/shopping-cart");
    case "folder-close":
      return import("react-icons/lib/fa/folder");
    case "folder-open":
      return import("react-icons/lib/fa/folder-open");
    case "resize-vertical":
      return import("react-icons/lib/fa/arrows-v");
    case "resize-horizontal":
      return import("react-icons/lib/fa/arrows-h");
    case "hdd":
      return import("react-icons/lib/fa/hdd-o");
    case "bullhorn":
      return import("react-icons/lib/fa/bullhorn");
    case "bell":
      return import("react-icons/lib/fa/bell");
    case "certificate":
      return import("react-icons/lib/fa/certificate");
    case "thumbs-up":
      return import("react-icons/lib/fa/thumbs-up");
    case "thumbs-down":
      return import("react-icons/lib/fa/thumbs-down");
    case "hand-right":
      return import("react-icons/lib/fa/hand-o-right");
    case "hand-left":
      return import("react-icons/lib/fa/hand-o-left");
    case "hand-up":
      return import("react-icons/lib/fa/hand-o-up");
    case "hand-down":
      return import("react-icons/lib/fa/hand-o-down");
    case "circle-arrow-right":
      return import("react-icons/lib/fa/arrow-circle-right");
    case "circle-arrow-left":
      return import("react-icons/lib/fa/arrow-circle-left");
    case "circle-arrow-up":
      return import("react-icons/lib/fa/arrow-circle-up");
    case "circle-arrow-down":
      return import("react-icons/lib/fa/arrow-circle-down");
    case "globe":
      return import("react-icons/lib/fa/globe");
    case "wrench":
      return import("react-icons/lib/fa/wrench");
    case "tasks":
      return import("react-icons/lib/fa/tasks");
    case "filter":
      return import("react-icons/lib/fa/filter");
    case "briefcase":
      return import("react-icons/lib/fa/briefcase");
    case "fullscreen":
      return import("react-icons/lib/fa/arrows-alt");
    case "dashboard":
      return import("react-icons/lib/fa/dashboard");
    case "paperclip":
      return import("react-icons/lib/fa/paperclip");
    case "heart-empty":
      return import("react-icons/lib/fa/heart-o");
    case "link":
      return import("react-icons/lib/fa/chain");
    case "phone":
      return import("react-icons/lib/fa/phone");
    case "pushpin":
      return import("react-icons/lib/fa/thumb-tack");
    case "usd":
      return import("react-icons/lib/fa/dollar");
    case "gbp":
      return import("react-icons/lib/fa/gbp");
    case "sort":
      return import("react-icons/lib/fa/sort");
    case "sort-by-alphabet":
      return import("react-icons/lib/fa/sort-alpha-asc");
    case "sort-by-alphabet-alt":
      return import("react-icons/lib/fa/sort-alpha-desc");
    case "sort-by-order":
      return import("react-icons/lib/fa/sort-numeric-asc");
    case "sort-by-order-alt":
      return import("react-icons/lib/fa/sort-numeric-desc");
    case "sort-by-attributes":
      return import("react-icons/lib/fa/sort-amount-asc");
    case "sort-by-attributes-alt":
      return import("react-icons/lib/fa/sort-amount-desc");
    case "unchecked":
      return import("react-icons/lib/fa/square-o");
    case "expand":
      return import("react-icons/lib/fa/caret-square-o-right");
    case "collapse-down":
      return import("react-icons/lib/fa/caret-square-o-down");
    case "collapse-up":
      return import("react-icons/lib/fa/caret-square-o-up");
    case "log-in":
      return import("react-icons/lib/fa/sign-in");
    case "flash":
      return import("react-icons/lib/fa/bolt");
    case "log-out":
      return import("react-icons/lib/fa/sign-out");
    case "new-window":
      return import("react-icons/lib/fa/share-square-o");
    case "record":
      return import("react-icons/lib/fa/circle");
    case "save":
      return import("react-icons/lib/fa/floppy-o");
    case "open":
      return import("react-icons/lib/fa/floppy-o");
    case "saved":
      return import("react-icons/lib/fa/floppy-o");
    case "import":
      return import("react-icons/lib/fa/arrow-circle-left");
    case "export":
      return import("react-icons/lib/fa/arrow-circle-right");
    case "send":
      return import("react-icons/lib/fa/paper-plane");
    case "floppy-disk":
      return import("react-icons/lib/fa/floppy-o");
    case "floppy-saved":
      return import("react-icons/lib/fa/floppy-o");
    case "floppy-remove":
      return import("react-icons/lib/fa/floppy-o");
    case "floppy-save":
      return import("react-icons/lib/fa/floppy-o");
    case "floppy-open":
      return import("react-icons/lib/fa/floppy-o");
    case "credit-card":
      return import("react-icons/lib/fa/credit-card");
    case "transfer":
      return import("react-icons/lib/fa/exchange");
    case "cutlery":
      return import("react-icons/lib/fa/cutlery");
    case "header":
      return import("react-icons/lib/fa/header");
    case "compressed":
      return import("react-icons/lib/fa/file-archive-o");
    case "earphone":
      return import("react-icons/lib/fa/phone");
    case "phone-alt":
      return import("react-icons/lib/fa/phone-square");
    case "sd-video":
      return import("react-icons/lib/fa/video-camera");
    case "hd-video":
      return import("react-icons/lib/fa/video-camera");
    case "subtitles":
      return import("react-icons/lib/fa/cc");
    case "copyright-mark":
      return import("react-icons/lib/fa/copyright");
    case "registration-mark":
      return import("react-icons/lib/fa/registered");
    case "cloud-download":
      return import("react-icons/lib/fa/cloud-download");
    case "cloud-upload":
      return import("react-icons/lib/fa/cloud-upload");
    case "level-up":
      return import("react-icons/lib/fa/level-up");
    case "copy":
      return import("react-icons/lib/fa/clone");
    case "paste":
      return import("react-icons/lib/fa/clipboard");
    case "alert":
      return import("react-icons/lib/fa/exclamation-triangle");
    case "bed":
      return import("react-icons/lib/fa/bed");
    case "apple":
      return import("react-icons/lib/fa/apple");
    case "erase":
      return import("react-icons/lib/fa/eraser");
    case "hourglass":
      return import("react-icons/lib/fa/hourglass");
    case "duplicate":
      return import("react-icons/lib/fa/clone");
    // case "scissors":
    //   return import("react-icons/lib/fa/scissors");
    case "bitcoin":
      return import("react-icons/lib/fa/bitcoin");
    case "btc":
      return import("react-icons/lib/fa/bitcoin");
    case "scale":
      return import("react-icons/lib/fa/balance-scale");
    case "education":
      return import("react-icons/lib/fa/graduation-cap");
    case "triangle-right":
      return import("react-icons/lib/fa/caret-right");
    case "triangle-left":
      return import("react-icons/lib/fa/caret-left");
    case "triangle-bottom":
      return import("react-icons/lib/fa/caret-down");
    case "triangle-top":
      return import("react-icons/lib/fa/caret-up");
    case "console":
      return import("react-icons/lib/fa/terminal");
    case "superscript":
      return import("react-icons/lib/fa/superscript");
    case "subscript":
      return import("react-icons/lib/fa/subscript");
    case "menu-left":
      return import("react-icons/lib/fa/angle-left");
    case "menu-right":
      return import("react-icons/lib/fa/angle-right");
    case "menu-down":
      return import("react-icons/lib/fa/angle-down");
    case "menu-up":
      return import("react-icons/lib/fa/angle-up");
  }
}

/**
 * Dispays an icon widget.
 *
 * @public
 */
export default class Icon extends React.Component {
  static propTypes = {
    /**
     * Name of the icon to render.
     *
     * See http://getbootstrap.com/components/#glyphicons-glyphs for all
     * available icons.
     */
    name: PropTypes.string.isRequired,

    /**
     * Extra CSS class name.
     */
    className: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      Component: load(props.name),
    };
  }


  render() {
    let {name, ...props} = this.props;
    let {Component} = this.state;
    if (!Component) {
      return null;
    } else if (!(Component instanceof Promise)) {
      return <Component aria-hidden {...props} />;
    } else {
      // Icon will be loaded: placeholder
      return <div style={{width: "1em", height: "1em"}}>&nbsp;</div>;
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.name !== this.props.name) {
      this.setState({Component: load(this.props.name)});
    } else if(this.state.Component instanceof Promise) {
      this.updateIcon();
    }
  }

  componentDidMount() {
    this.updateIcon();
  }

  updateIcon() {
    let {Component} = this.state;
    if(Component && Component instanceof Promise) {
      Component.then(m => {
        this.setState({Component: m.default});
      })
    }
  }
}
