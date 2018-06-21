import * as React from 'react';

interface MessageContextOptions {
    functions?: object
    useIsolating: boolean
}
interface Message {
    id: string
    message: string
}

export class MessageContext {
    constructor(locales: string|string[], options?: MessageContextOptions);
    public getMessages(): Iterable<Message>; // TODO get messages() --- an accessor cannot be declared in ambient context
    public hasMessage(id: string): boolean;
    public getMessage(id: string): string;
    public addMessages(messages: string): void;
    public format(message: object|string, args: object|undefined, errors: string[]): string;
}
