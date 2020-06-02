declare type TOnClick = () => void;
declare type Props = {
    enum?: " " | "a" | "b";
    value: string;
    position?: {
        x: number;
        y: number;
    };
    onClick?: TOnClick;
};
export declare function StoryButton(props?: Props): JSX.Element;
export {};
