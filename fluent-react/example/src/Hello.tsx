import React, { useState } from "react";
import { useTranslate } from "@fluent/react";

export function Hello() {
    let [userName, setUserName] = useState("");
    const { t, tAttributes } = useTranslate()

    return (
        <div>
            {userName ?
                <h1>{t('hello', { userName })}</h1>
                : <h1>{t('hello-no-name')}</h1>
            }

            <input
                type="text"
                placeholder={tAttributes('type-name').placeholder}
                onChange={evt => setUserName(evt.target.value)}
                value={userName}
            />
        </div>
    );
}
