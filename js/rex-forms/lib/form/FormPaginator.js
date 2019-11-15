/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as Focus from "@prometheusresearch/react-ui-0.21/src/Focus";
import { NextIcon, PrevIcon } from "../icons";

import { InjectI18N } from "rex-i18n";

export default InjectI18N(
  class FormPaginator extends React.Component {
    render() {
      let {
        currentPageNumber,
        pageCount,
        hiddenPageNumberList,
        disabledPageNumberList,
        onPage,
        ...props
      } = this.props;

      let prevButtons = [];
      let nextButtons = [];
      let currentButton;
      for (let pageNumber = 0; pageNumber < pageCount; pageNumber++) {
        let button = (
          <Focus.Focusable key={pageNumber} focusIndex={pageNumber}>
            <PageButton
              tabIndex={-1}
              groupHorizontally
              hidden={hiddenPageNumberList[pageNumber]}
              active={currentPageNumber === pageNumber}
              disabled={disabledPageNumberList[pageNumber]}
              pageNumber={pageNumber}
              onPage={onPage}
            >
              {this.getI18N().formatNumber(pageNumber + 1)}
            </PageButton>
          </Focus.Focusable>
        );
        if (currentPageNumber === pageNumber) {
          currentButton = button;
        } else if (pageNumber > currentPageNumber) {
          nextButtons.push(button);
        } else {
          prevButtons.push(button);
        }
      }

      if (prevButtons.length + nextButtons.length > 10) {
        if (prevButtons.length > 5) {
          prevButtons = prevButtons
            .slice(0, 2)
            .concat(<EllipsisButton key="__prevEllipsis__" />)
            .concat(prevButtons.slice(prevButtons.length - 2));
        }
        if (nextButtons.length > 5) {
          nextButtons = nextButtons
            .slice(0, 2)
            .concat(<EllipsisButton key="__nextEllipsis__" />)
            .concat(nextButtons.slice(nextButtons.length - 2));
        }
      }

      let prevPageNumber = -1;
      for (let i = currentPageNumber - 1; i >= 0; i--) {
        if (!disabledPageNumberList[i] && !hiddenPageNumberList[i]) {
          prevPageNumber = i;
          break;
        }
      }
      let prevDisabled = prevPageNumber < 0;
      let showPrev = currentPageNumber != 0;

      let nextPageNumber = pageCount;
      for (let i = currentPageNumber + 1; i < pageCount; i++) {
        if (!disabledPageNumberList[i] && !hiddenPageNumberList[i]) {
          nextPageNumber = i;
          break;
        }
      }
      let nextDisabled = nextPageNumber >= pageCount;
      let showNext = currentPageNumber != pageCount - 1;

      return (
        <Focus.FocusableList tabIndex={0} activeDescendant={pageCount}>
          <ReactUI.Block textAlign="center" width="100%" {...props}>
            <ReactUI.Block inline float="start" width={120} minHeight={1}>
              {showPrev && (
                <Focus.Focusable focusIndex={prevDisabled ? null : -1}>
                  <PageButton
                    icon={<PrevIcon />}
                    tabIndex={-1}
                    disabled={prevDisabled}
                    pageNumber={prevPageNumber}
                    onPage={onPage}
                  >
                    {this._("Previous")}
                  </PageButton>
                </Focus.Focusable>
              )}
            </ReactUI.Block>
            <ReactUI.Block inline textAlign="center">
              {prevButtons}
              {currentButton}
              {nextButtons}
            </ReactUI.Block>
            <ReactUI.Block inline float="end" width={120} minHeight={1}>
              {showNext && (
                <Focus.Focusable focusIndex={nextDisabled ? null : pageCount}>
                  <PageButton
                    iconAlt={<NextIcon />}
                    tabIndex={-1}
                    disabled={nextDisabled}
                    pageNumber={nextPageNumber}
                    onPage={onPage}
                  >
                    {this._("Next")}
                  </PageButton>
                </Focus.Focusable>
              )}
            </ReactUI.Block>
          </ReactUI.Block>
        </Focus.FocusableList>
      );
    }
  },
);

let PageButton = React.forwardRef(
  ({ onPage, pageNumber, active, hidden, style, children, ...props }, ref) => {
    let display = hidden ? "none" : "inline-block";
    return (
      <ReactUI.Button
        {...props}
        ref={ref}
        variant={{ active }}
        style={{ ...style, display }}
        onClick={onPage && onPage.bind(null, { pageNumber })}
      >
        {children}
      </ReactUI.Button>
    );
  },
);

function EllipsisButton(props) {
  return (
    <ReactUI.Button {...props} groupHorizontally tabIndex={-1} disabled>
      ...
    </ReactUI.Button>
  );
}
