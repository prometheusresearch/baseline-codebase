/// <reference types="react" />
declare type TOnClick = () => void;
declare type Props = {
    /**
     * Example value to display
     **/
    enum?: " " | "a" | "b";
    /** Example value with string type */
    value: string;
    /** Example value with some object type */
    position?: {
        x: number;
        y: number;
    };
    /** Example onClick with custom type */
    onClick?: TOnClick;
};
export declare function StoryButton(props?: Props): JSX.Element;
export {};
