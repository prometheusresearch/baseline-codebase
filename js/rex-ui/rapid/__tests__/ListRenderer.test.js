/**
 * @flow
 */

import "./matchMediaMock.js";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { MuiThemeProvider } from "@material-ui/core";

import { ThemeProvider, DEFAULT_THEME } from "../index";
import { ListItem, ListRenderer } from "../List";
import * as Field from "../Field";

describe("ListRenderer", function() {
  test("renders ListRenderer with no data and no actions", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ListRenderer
            items={[]}
            RenderItem={({ item }) => <ListItem primary={String(item.id)} />}
            placeholder="test-placeholder"
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // list should have 1 item with placeholder text
    expect(screen.getByRole("list").children.length).toBe(1);
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(1);
    expect(listItems[0]).toHaveTextContent("test-placeholder");
  });

  test("renders ListRenderer with data", () => {
    const items = [
      { id: "test-id-1" },
      { id: "test-id-2" },
      { id: "test-id-3" },
      { id: "test-id-4" },
    ];

    const actionFn = jest.fn();
    const actions = [
      {
        name: "test-action",
        kind: "primary",
        title: "Test action",
        run: actionFn,
      },
    ];

    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ListRenderer
            actions={actions}
            items={items}
            RenderItem={({ item }) => <ListItem primary={String(item.id)} />}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // list should have 4 items with content
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBe(4);
    listItems.forEach((item, idx) => {
      expect(item).toHaveTextContent(items[idx].id);
    });

    // list should contain 1 action
    const actionButtons = screen.getAllByRole("button");
    expect(actionButtons.length).toBe(1);
    expect(actionButtons[0]).toHaveTextContent("Test action");

    // click on action button should call the action function
    userEvent.click(actionButtons[0]);
    expect(actionFn).toHaveBeenCalled();
  });

  test("renders ListRenderer with custom renders", () => {
    const items = [{ id: "test-id-1" }];

    const actionRun = jest.fn();
    const actionRender = jest
      .fn()
      .mockImplementation(({ data, params, action }) => (
        <div
          data-testid="test-action-container"
          onClick={() => action?.run({ data, params })}
        >
          <div data-testid="test-action-data">{JSON.stringify(data)}</div>
          <div data-testid="test-action-params">{JSON.stringify(params)}</div>
          <div data-testid="test-action-action">{JSON.stringify(action)}</div>
        </div>
      ));
    const action = {
      name: "test-action",
      kind: "primary",
      title: "Test action",
      run: actionRun,
      render: actionRender,
    };

    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ListRenderer
            actions={[action]}
            items={items}
            RenderItem={({ item }) => (
              <div data-testid="test-field-container">
                <div data-testid="test-field-data">{JSON.stringify(item)}</div>
              </div>
            )}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    const actionContainer = screen.getByTestId("test-action-container");
    expect(actionContainer).toBeInTheDocument();
    expect(screen.getByTestId("test-action-data")).toHaveTextContent(
      JSON.stringify(items),
    );
    expect(screen.getByTestId("test-action-params")).toHaveTextContent("");
    expect(screen.getByTestId("test-action-action")).toHaveTextContent(
      JSON.stringify(action),
    );

    userEvent.click(actionContainer);
    expect(actionRun).toHaveBeenCalledWith({
      data: items,
      params: undefined,
    });

    expect(screen.getByTestId("test-field-container")).toBeInTheDocument();
    expect(screen.getByTestId("test-field-data")).toHaveTextContent(
      JSON.stringify(items[0]),
    );
  });
});
