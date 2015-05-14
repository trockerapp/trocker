# trocker
This chrome extension is an email Tracker Blocker, hence the name: Trocker!

It uses chrome's webRequest api to intercept any requests to known tracking urls and blocks them according to user's preferences.

Optionally, it will also inject a script to the tab that the request has originated from. This script can count the number of interceptors in the DOM and show it on the extension icon (browserAction), or optionally expose them (make the invisible tracking pixels visible).

More info is available in WebstoreDesc.txt