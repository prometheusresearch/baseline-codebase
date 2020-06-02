import * as React from "react";
 
type TOnClick = () => void;

type Props = {
  /**
   * Example value to display
   **/
  enum?: " " | "a" | "b";

  /** Example value with string type */
  value: string,
 
  /** Example value with some object type */
  position?: { x: number, y: number };
 
  /** Example onClick with custom type */
  onClick?: TOnClick;
}

export function StoryButton(props: Props = {value: "Hello world!"}) {
  let [state, setState] = React.useState(0)
  return <button onClick={() => {
    setState(++state);
    props.onClick();
  }}>{props.value}: {state}</button>
}
