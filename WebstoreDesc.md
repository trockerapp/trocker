Tracking your emails to know if the receiver has opened them or not is awesome, so is being immune to it! Trocker gives you the latter! It blocks attempts by email trackers and won't let them track what you do with the emails you receive.

You will be amazed to see how many of the emails you receive have trackers in them!

If you have any issues with Trocker, email us at trockerapp@gmail.com or report the issue on GitHub (https://github.com/trockerapp/trocker/issues). Thanks for reporting issues. Given that Trocker needs to react to any breaking changes in webmails, we may not know about new issues unless you report them. Also, please consider giving us a chance to fix the issues before leaving a bad rating/review.

And follow us on twitter: https://twitter.com/trockerapp

More information:
You can trust Trocker! Trocker runs locally on your machine and does not send or receive any information from the Internet. It needs permission to all tabs in order to be able to detect and prevent any tracking images or tracked links from being loaded from any of the tabs. But it makes absolutely no outbound Internet access and we neither gather nor use any data about you or your browsing behavior.

Trocker is also open source with the source code available at https://github.com/trockerapp/trocker and we encourage everyone to check it out from there or from Chrome Dev tools to confirm that there are no suspicious activities being done.

Trocker keeps you safe in all webmails by blocking known trackers in the background. It has additional capabilities in supported webmails (currently Gmail™, Yahoo! and Outlook.com). In these webmails, it exposes the trackers visually and has a heuristic tracker detection that detects and blocks almost any email tracking attempt, even from not well-known trackers!

Trocker is very efficient as it only gets activated when a tracker is detected.

Technical details:
Some email trackers track emails by injecting an invisible small image in the mail that is hosted in a specific address in their server. They know when the email is opened by looking at the download requests of the injected images on their servers. 
Trocker (as a lovely Tracker Blocker) stops this by simply blocking those image links from being loaded. It finds those injected images by looking at the url and matching the url pattern with the tracking servers that host injected images.
If you yourself are a user of these tracking services (you track emails you send others), your service wouldn't be affected and will work fine. Trocker would only defend you from OTHERS tracking you.
Moreover, some links are click tracked meaning that if you click on them, your clicks are logged and tracked. Trocker tries to bypass those links and redirect you directly to the original target without you being tracked. If not possible, Trocker will inform you that the link you've clicked on is tracked.
No one will be able to know when and if you open their emails, or click on their links if you enable Trocker. In supported webmails (Gmail, Yahoo and Outlook.com), Trocker has a heuristic tracker detection that will detect and block almost any tracker, even if it is unknown. This works based on the fact that very tiny images are almost always trackers. After all, if they want you to see the image, they will make it bigger than 1x1 pixel!

Change log:
3.4.0:
- Removed the vestigial 'tabs' permission from Manifest V2.
- Refined the options page to only prompt for permissions when necessary.

3.1.1:
- Added support for Yahoo's new image proxy format and DOM design.
- Fixed a bug that caused image flickering in compose windows in Yahoo mail on Firefox.
- Adds more known trackers to universal block list.

3.3.0:
- Improved permission check: Checks for required permissions on startup and guides you to the settings page if they are missing. Important for Firefox since Firefox does not automatically grant permissions or warn the user about missing permissions.

3.2.0:
- Fixes the new bug in Firefox where tracked link forwarding would cause an infinite loop.

3.1.2:
- Fixes infinite redirect loop on tracked links in Firefox.

3.1.0:
- Adds Manifest V3 support for Firefox bringing it to parity with Chrome.
- Fixes console errors and improved stability.

3.0.4:
- Improves tracker detection in background images.

3.0.3:
- Fixes bug in the relevant Trocker setting being able to control the count down time in the tracked link bypasser.

3.0.2:
- Fixes Google chat images not loading.
- Fixes Gmail tool bar third party icons not loading.

3.0.1:
- Fixed bug with service worker not starting at all.

3.0.0:
- This release makes Trocker compatible with the newly mandated Manifest V3, which required significant rewriting of all blocking/redirecting features since the API we used before (webRequestBlocking) to block tracking images/links before they loaded is no longer available for extensions to use.
- In the new Manifest V3, with the declarativeNetRequest API, we are only allowed to block images/urls that match pre-specified domains.
- This means that we can only block listed trackers and all trackers in webmails that use proxies to load all images. Only Gmail and Yahoo mail consistently load images via proxy urls, so we can block all proxied images from these webmails unless they are proved safe and whitelisted.
- For Outlook, unfortunately images are not loaded with a proxy (at least not consistently as of June 2024), so in Outlook, Trocker will only be able to (i) expose all tracked emails, (ii) block tracked emails that use pre-known tracking services. Blocking unknown trackers in Outlook is the only functionality from the previous versions of Trocker that we could not implement in the new version. 🎉
- Background page has been replaced with a service-worker page as required by Manifest V3.
- Tracked emails are now marked with a red envelope if Trocker was only able to expose the trackers but was not able to block them (e.g. in Outlook).
- A blue envelope means that Trocker both exposed and blocked the trackers in the email.
- Show live blocked/exposed statistics in the settings page.
- Various other visual updates in the settings and change log pages.

2.7.0:
- Improves handling of drafts, print previous, quotes, and general stability in YMail, Outlook and Gmail.
- Adds visual debugging tools for webmails.
- Adds info on options for supporting Trocker.

2.6.27:
- Improves handling of drafts and general stability in YMail.

2.6.26:
- Improves handling of changes in email content.
- Adds support for new Gmail proxy url.
- Fixes Outlook attachment preview blocking issue that only affected Firefox.

2.6.24:
- Adapts to changes in Gmail.

2.6.23:
- Adds support for new Outlook design updates.

2.6.21:
- Adds support for new Outlook design updates.

2.6.20:
- Fixes Outlook sidebar icon issue in Firefox.

2.6.19:
- Fixes Outlook sidebar icon issue in Firefox.

2.6.16:
- Adapts to new under the hood changes in Outlook.
- Adds more known trackers to block list.

2.6.15:
- Fixes Yahoo/Outlook bug in the new heuristic.
- Adds graceful handling of lost connection to extension context after updates.

2.6.14:
- Adds heuristic detection of tracking images based on patterns in the url.

2.6.12:
- Fixes handling of attachments in Outlook.
- Improves logs for easier debugging.

2.6.11:
- Improves handling of webmails that load images gradually (e.g. Outlook).
- Adds Trocker version to options and logs.

2.6.10:
- Adds support for classic Yahoo mail.

2.6.9:
- Fixes interference with Gmail's signature switch.

2.6.8:
- Adds advanced option to customize known open/click tracker lists.
- Adds more known trackers to universal block list.

2.6.7:
- Fixes new issue with Gmail sidebar that blocked some extension icons.

2.6.5:
- Fixes new issue that blocked some Outlook UI images.
- Adds blocking for additional known trackers.
- Improves heuristic detection of trackers.

2.6.4:
- Fixes new Yahoo mail proxy issue that blocked all images.
- Improves handling of data-images.

2.6.3:
- Improves detection of hidden tracking images.
- Adds the option to change tracked link bypass timeout.

2.6.2:
- Adds support for the outlook.office.com url for Outlook.

2.6.1:
- Adds support for the updated outlook.com and office365.

2.6.0:
- Improves mail.yahoo.com support.
- Blocks additional trackers.
- Improves the options page.

2.5.2:
- Makes non-essential permissions optional (for more info see the Trocker options).
- Improves outlook.com support.
- Improves the options page.

2.4.3:
- Adds support for outlook.office365.com.

2.4.2:
- Adds support for the new outlook.com.

2.4.1:
- Adds Manifest V3 support for Firefox bringing it to parity with Chrome.

2.3.7:
- Improves tests. Adds link to test page from advanced options.

2.3.6:
- Adds a small fix to improve efficiency.

2.3.5:
- Fixes broken inline image bug in Gmail.
- Fixes compose window bug that rechecked for trackers even if draft had not changed.
- Fixes compose bug that blocked contact images in Inbox.
- Blocks additional click trackers.

2.3.4:
- Fixes bug that blocked contact images in Inbox.
- Add workaround for Gmail's email auto-refresh for unread messages that could lead to breaking images.

2.3.3:
- Fixes bug that blocked images in Gmail side add-ons.

2.3.2:
- Fixes bug that could block Google images outside Gmail if they used the same proxy url as Gmail.

2.3.1:
- Fixes bug in heuristic blocking in outlook.com.

2.3.0:
- Adds the option to allow tracking temporarily for a specific email, i.e. sending read receipts.
- Adds support for more known email tracking systems.
- Adapts to changes in outlook.com.
- Adds preliminary support for new outlook.com beta.

2.2.1:
- bugfix for outlook.com.

2.2.0:
- Added support for the redesigned outlook.com.

2.1.4:
- 1 tracker was added to block list.

2.1.3:
- 4 trackers were added to block list.

2.1.1:
- Better handling of "view entire message" in Gmail and "view full email" in Inbox.
- Improvements in heuristic tracker detection.

2.1.0:
- Added support for Google Inbox and Microsoft Outlook. Heuristic tracker detection and showing number of trackers in each email now works in Google's Inbox and Microsoft's Outlook.com in addition to Gmail.
- Block even more trackers everywhere (now iOS MailTracker in addition to others)

2.0.3:
- Improvements in how Trocker works in Gmail

2.0.2:
- Bug fix

2.0.1:
- Block even more trackers (now Bananatag and Mixmax in addition to others)
- Improvements in click tracker blocking in Gmail
- Bug fix in link tracking prevention
- Twitter link added to the options page (Follow @trockerapp)

2.0.0:
- Special Gmail treatment. In Gmail, an icon is shown on top of each email that is found to have a tracker in it.
- Context aware in Gmail; won't expose trackers in print view or compose windows.
- Heuristic tracker detection. Now any tiny image that looks like a tracker is blocked in Gmail. 
- New advanced options for those who want to swim deeper!
- Block even more trackers (now 7 major ones). 

1.2.2:
- Block even more trackers (now 4 major ones)

1.2.0:
- Blocking more Trackers!
- Trocker now also bypasses tracked links (links that inform the sender when you click on them) as well as tracked emails (emails that inform the sender when you open them).
- All new click tracker bypasser page
- Exposing link trackers by adding a "T" to the mouse pointer
- Support Outlook.com's image proxy
- Improvement in exposing open trackers (specially in compose window).
- Improved options page.

1.1.1:
- Don't open changelog on small updates
- Bugfix for new installations.

1.1.0:
- Open changelog in a new tab on update

1.0.6:
- Extension's name was changed to Trocker in order to avoid similarities with trademarked names.
- Updated look and feel of the app.
- Icon only shows the number of trackers found on the current tab.
- New options page (for chrome v42 and later)

1.0.5:
- Exposing Trackers is disabled by default. You can enable it from the options page if you like!
- Updated Icon for disabled extension.

1.0.4:
- Improvements in exposing trackers.

1.0.3:
- The extension can now make tracking images visible. You can disable this feature in the options page.
