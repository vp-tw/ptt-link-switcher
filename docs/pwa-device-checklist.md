# PWA device checklist

Run on physical iOS Safari and Android Chrome. Record the date, device, OS,
browser version, and deployed revision. The Chromium suite exercises web
behavior and touch controls in emulation. Home-screen installation and OS
launch behavior require devices.

1. Open the published app in a fresh browser profile. Install it using
   Safari's Add to Home Screen or Chrome's Install App entry, then launch
   it from its icon.
2. Convert the built-in example. Copy a reader URL, paste it into a local
   text field, and check that it matches the reader's displayed URL. Reorder
   a reader with the move buttons and change the default.
3. After an online reload, enable airplane mode and close and relaunch the
   installed app. Convert the built-in example again. Confirm that the
   preference changes survived and that reader logos have offline fallbacks.
4. With the old build still open, reconnect and deploy a new build to the
   test origin. Reopen the app online to check for an update. Choose Later,
   verify the current conversion remains usable, then reopen and accept the
   update. Confirm the new build loads and preferences survive.
