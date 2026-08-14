import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import { mount } from "svelte";

import App from "./App.svelte";
import "./app.css";

const target = document.querySelector("#app");

if (!(target instanceof HTMLElement)) {
  throw new Error("App target was not found.");
}

mount(App, { target });
