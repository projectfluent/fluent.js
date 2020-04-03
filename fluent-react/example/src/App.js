import React from "react";
import { Localized } from "@fluent/react";
import { FluentDateTime } from "@fluent/bundle";
import { Hello } from "./Hello";
import { LocalizedSignIn } from "./Prompt";

export function App(props) {
    let date = new Date();
    return <>
        <Hello />

        <Localized
            id="today-date"
            vars={{
                date: new FluentDateTime(date, {
                    month: "long",
                    day: "numeric",
                })
            }}
        >
            <p>
                {"Today is {$date}."}
            </p>
        </Localized>

        <Localized
            id="today-time"
            vars={{
                date: new FluentDateTime(date, {
                    hour: "numeric",
                    minute: "numeric",
                })
            }}
        >
            <p>
                {"It's {$date}."}
            </p>
        </Localized>

        <LocalizedSignIn />

        <Localized id="change-locale" elems={{select: props.LocaleSelect}}>
            <p>{"Change locale: <select></select>"}</p>
        </Localized>
    </>;
}
