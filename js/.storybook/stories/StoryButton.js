"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
exports.__esModule = true;
var React = __importStar(require("react"));
function StoryButton(props) {
    if (props === void 0) { props = { value: "Hello world!" }; }
    var _a = React.useState(0), state = _a[0], setState = _a[1];
    return React.createElement("button", { onClick: function () {
            setState(++state);
            props.onClick();
        } },
        props.value,
        ": ",
        state);
}
exports.StoryButton = StoryButton;
