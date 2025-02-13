import { Temporal } from 'temporal-polyfill';
import { FluentTemporal } from "../esm/index.js";

export const caster = new FluentTemporal(Temporal);
export { Temporal, FluentTemporal };
