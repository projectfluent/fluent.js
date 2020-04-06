import React, { ReactNode, ReactElement } from "react";
import { Localized } from "@fluent/react";
import { FluentDateTime } from "@fluent/bundle";
import { Hello } from "./Hello";
import { LocalizedSignIn } from "./SignIn";

export function App() {
    let date = new Date();
    return <>
        <Hello />

        <Localized
            id="today-date"
            vars={{
                date: new FluentDateTime(date.getTime(), {
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
                date: new FluentDateTime(date.getTime(), {
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
    </>;
}
