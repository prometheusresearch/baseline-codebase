var publicPath = window.__PUBLIC_PATH__;

if (publicPath === undefined) {
  console.error(
    [
      "window.__PUBLIC_PATH__ is not defined,",
      "define it in application HTML page/template"
    ].join(" ")
  );
} else {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window.__PUBLIC_PATH__;
}
