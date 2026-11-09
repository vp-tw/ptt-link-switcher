# Mobile PWA acceptance checklist

Run these three paths on physical iPhones with Safari and Android phones with
Chrome. Record the date, device, OS, browser version, build revision, and the
outcome of each path.

1. **Launch from the home screen.** Install the app while online, then open it
   from the home screen icon. Fill in the built-in example and verify that the
   installed app displays the reader links.
2. **Cold launch offline.** Open the installed app online once to let it cache
   its assets. Close the app completely, disconnect the phone, then reopen it
   from the home screen icon. Fill in the example and verify that the reader
   links appear.
3. **Update an installed build.** Install a test build, then deploy a
   distinguishable newer build to the same test URL. Reopen the installed app
   online and record when the update prompt appears. Choose Later and verify
   the current build still works. Reopen the app, accept the update, and verify
   that it loads the newer build and still converts the example.

The [Chromium browser suite](../apps/web/e2e/conversion.spec.mjs) covers clipboard
copying, keyboard and touch ordering, reader preferences, icon fallback,
offline reload, and the update prompt's Later and Update actions.
