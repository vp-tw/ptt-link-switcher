import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource-variable/noto-sans-tc";
import "@fontsource/ibm-plex-mono/400.css";
import { mount } from "svelte";
import { registerSW } from "virtual:pwa-register";

import App from "./App.svelte";
import "./app.css";
import { configurePwaUpdate } from "./pwa-update.js";

const target = document.querySelector("#app");

if (!(target instanceof HTMLElement)) {
  throw new Error("App target was not found.");
}

mount(App, { target });

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    configurePwaUpdate(updateServiceWorker);
  },
});
