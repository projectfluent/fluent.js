import React, { useState } from "react";
import { Localized } from "@fluent/react";
import { FluentDateTime } from "@fluent/bundle";
import { Hello } from "./Hello";
import { SignIn } from "./SignIn";
import { LanguageSelector } from "./LanguageSelector";

export function App() {
    let [date] = useState(() => new Date());
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
            id="today-weekday"
            vars={{
                date: new FluentDateTime(date.getTime(), {
                    weekday: "long",
                })
            }}
        >
            <p>
                {"It's {$date}."}
            </p>
        </Localized>

        <SignIn />

        <hr />

        <LanguageSelector />
    </>;
}
