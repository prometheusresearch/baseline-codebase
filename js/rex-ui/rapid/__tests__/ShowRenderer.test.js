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
import { ShowRenderer } from "../ShowRenderer";
import * as Field from "../Field";
import * as Filter from "../Filter";

describe("ShowRenderer", function() {
  test("renders basic ShowRenderer without title and fields", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer flat square data={[{ id: "test-id-1" }]} />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have no title
    expect(
      screen.queryByTestId("show-header-container"),
    ).not.toBeInTheDocument();

    // fields should be empty
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children.length).toBe(0);

    // should not be actions
    expect(
      screen.queryByTestId("show-actions-container"),
    ).not.toBeInTheDocument();
  });

  test("renders ShowRenderer with title and one field", () => {
    render(
      <ThemeProvider theme={DEFAULT_THEME}>
        <MuiThemeProvider theme={DEFAULT_THEME}>
          <ShowRenderer
            flat
            square
            data={{ id: "test-id-1" }}
            title="Test title"
            fields={[Field.configureField("id")]}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have title
    expect(screen.getByText("Test title")).toBeInTheDocument();

    // fields should be have 1 child
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children.length).toBe(1);

    // field should have label and value
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("test-id-1")).toBeInTheDocument();
  });

  test("renders ShowRenderer with multiple fields and actions", () => {
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
          <ShowRenderer
            flat
            square
            data={{ id: "test-id-1", name: "test-name", age: 19, sex: "male" }}
            title="John Doe"
            fields={Field.configureFields(["name", "age", "sex", "empty"])}
            actions={actions}
          />
        </MuiThemeProvider>
      </ThemeProvider>,
    );

    // should have title
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // fields should be have 3 children
    const fieldsContainer = screen.getByTestId("show-content-container");
    expect(fieldsContainer).toBeInTheDocument();
    expect(fieldsContainer.children.length).toBe(4);

    // fields should have label and value
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("test-name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("Sex")).toBeInTheDocument();
    expect(screen.getByText("male")).toBeInTheDocument();

    // non existing field should have empty value
    expect(screen.getByText("Empty")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    // list should contain 1 action
    expect(screen.getByTestId("show-actions-container")).toBeInTheDocument();
    const actionButtons = screen.getAllByRole("button");
    expect(actionButtons.length).toBe(1);
    expect(actionButtons[0]).toHaveTextContent("Test action");

    // click on action button should call the action function
    userEvent.click(actionButtons[0]);
    expect(actionFn).toHaveBeenCalled();
  });
});
