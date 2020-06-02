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
var react_1 = require("@storybook/react");
var addon_actions_1 = require("@storybook/addon-actions");
var Info_1 = require("./Info");
var StoryButton_1 = require("./StoryButton");
react_1.storiesOf("Button", module).add("With example value", Info_1.Info(function () { return (React.createElement(StoryButton_1.StoryButton, { value: "Hello there!", onClick: addon_actions_1.action('StoryButton onClick') })); }));
