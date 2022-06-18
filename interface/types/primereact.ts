import { InputTextProps } from "primereact/inputtext";

type InputTextOnChange = Exclude<InputTextProps["onChange"], undefined>;
export type InputTextOnChangeEvent = Parameters<InputTextOnChange>[0];
