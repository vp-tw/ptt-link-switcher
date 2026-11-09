# PWA acceptance checklist

Run the steps on desktop Chrome and Edge, Safari on macOS Sonoma 14 or later,
and physical devices with iOS Safari and Android Chrome. Record the date,
device, OS, browser version, and deployed revision. The Chromium suite covers
offline reload and the update prompt in a browser. Use the installed app to
verify launch from the operating system.

1. Open the published app in a fresh browser profile. Use the desktop
   browser's install command, Safari's Add to Dock or Add to Home Screen
   command, or Android Chrome's Install App entry. Launch the app from its
   operating system icon.
2. Convert the built-in example. Copy a reader URL, paste it into a local
   text field, and check that it matches the reader's displayed URL. Reorder
   a reader with the move buttons and change the default.
3. After an online reload, disconnect the device and close and relaunch the
   installed app. Convert the built-in example again. Confirm that the
   preference changes survived and that reader logos have offline fallbacks.
4. With the old build still open, reconnect and deploy a new build to the
   test origin. Reopen the app online to check for an update. Choose Later,
   verify the current conversion remains usable, then reopen and accept the
   update. Confirm the new build loads and preferences survive.
