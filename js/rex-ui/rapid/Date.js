// @flow

type Props = {|
  date: string | Date,
|};

export function RenderDate(props: Props) {
  let date = props.date;
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
