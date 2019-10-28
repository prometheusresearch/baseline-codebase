// @flow

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as RexGraphQL from "rex-graphql";
import { Pick, ComponentLoading } from "rex-ui/rapid";
import { Show } from "rex-ui/rapid/show";
import Button from "@material-ui/core/Button";

const endpoint = RexGraphQL.configure("/_api/graphql");

function App() {
  const [componentToShow, setComponentToShow] = React.useState<"pick" | "show">(
    "pick"
  );
  const [selectedRow, setSelectedRow] = React.useState<?any>(null);

  const onRowClick = (row: any) => {
    setComponentToShow("show");
    setSelectedRow(row);
  };

  const reset = () => {
    setComponentToShow("pick");
    setSelectedRow(null);
  };

  switch (componentToShow) {
    case "show": {
      if (selectedRow != null) {
        return (
          <div>
            <div>
              <Button onClick={reset}>Reset</Button>
            </div>
            <Show
              endpoint={endpoint}
              fetch={"user.get"}
              args={{ id: selectedRow.id }}
            />
          </div>
        );
      }
    }

    default: {
      return (
        <Pick
          endpoint={endpoint}
          fetch={"user.paginated"}
          isRowClickable={true}
          onRowClick={onRowClick}
        />
      );
    }
  }
}

let root = document.getElementById("root");
invariant(root != null, "DOM is not avaialble: missing #root");

ReactDOM.render(
  <React.Suspense fallback={ComponentLoading}>
    <App />
  </React.Suspense>,
  root
);
