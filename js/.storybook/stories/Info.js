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
var addon_info_1 = require("@storybook/addon-info");
exports.Info = function (fn) { return addon_info_1.withInfo({ inline: true })(function () {
    return React.createElement("div", { style: { padding: '10px 40px' } }, fn({}));
}); };
