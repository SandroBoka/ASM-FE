import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

export function AppTextField({ id, label, name, ...props }: TextFieldProps) {
    const inputId = id ?? name;

    return (
        <label className="ui-field" htmlFor={inputId}>
            <span className="ui-field__label">{label}</span>
            <input className="ui-field__input" id={inputId} name={name} {...props} />
        </label>
    );
}
