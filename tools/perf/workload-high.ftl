# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.


# browser/locales/en-US/browser/menubar.ftl

[[ File menu ]]

file-menu = { brand-full-name }
    [xul/label]     File
    [xul/accesskey] F
tab-menuitem = { brand-full-name }
    [xul/label]      New Tab
    [xul/accesskey]  T
tab-key = { brand-full-name }
    [xul/key]        t
new-user-context-menu = { brand-full-name }
    [xul/label]      New Container Tab
    [xul/accesskey]  C
new-navigator-menuitem = { brand-full-name }
    [xul/label]      New Window
    [xul/accesskey]  N
new-navigator-key = { brand-full-name }
    [xul/key]        N
new-private-window-menuitem = { brand-full-name }
    [xul/label]      New Private Window
    [xul/accesskey]  W
new-non-remote-window-menuitem = { brand-full-name }
    [xul/label]      New Non-e10s Window

# Only displayed on OS X, and only on windows that aren't main browser windows,
# or when there are no windows but Firefox is still running.
open-location-menuitem = { brand-full-name }
    [xul/label]      Open Location…
open-file-menuitem = { brand-full-name }
    [xul/label]      Open File…
    [xul/accesskey]  O
open-file-key = { brand-full-name }
    [xul/key]        o

close-menuitem = { brand-full-name }
    [xul/label]      Close
    [xul/accesskey]  C
close-key = { brand-full-name }
    [xul/key]        W
close-window-menuitem = { brand-full-name }
    [xul/label]      Close Window
    [xul/accesskey]  d

# [xul/accesskey2] is for content area context menu
save-page-menuitem = { brand-full-name }
    [xul/label]      Save Page As…
    [xul/accesskey]  A
    [xul/accesskey2] P
save-page-key = { brand-full-name }
    [xul/key]        s

email-page-menuitem = { brand-full-name }
    [xul/label]      Email Link…
    [xul/accesskey]  E

print-setup-menuitem = { brand-full-name }
    [xul/label]      Page Setup…
    [xul/accesskey]  u
print-preview-menuitem = { brand-full-name }
    [xul/label]      Print Preview…
    [xul/accesskey]  v
print-menuitem = { brand-full-name }
    [xul/label]      Print…
    [xul/accesskey]  P
print-key = { brand-full-name }
    [xul/key]        p

go-offline-menuitem = { brand-full-name }
    [xul/label]      Work Offline
    [xul/accesskey]  k

quit-application-menuitem = { brand-full-name }
    [xul/label]      Quit
    [xul/accesskey]  Q
quit-application-menuitem-win = { brand-full-name }
    [xul/label]      Exit
    [xul/accesskey]  x
quit-application-menuitem-mac = { brand-full-name }
    [xul/label]      Quit { brand-shorter-name }
# Used by both Linux and OSX builds
quit-application-key-unix = { brand-full-name }
    [xul/key]        Q

[[ Edit menu ]]

edit-menu = { brand-full-name }
    [xul/label]      Edit
    [xul/accesskey]  E
undo-menuitem = { brand-full-name }
    [xul/label]      Undo
    [xul/accesskey]  U
undo-key = { brand-full-name }
    [xul/key]        Z
redo-menuitem = { brand-full-name }
    [xul/label]      Redo
    [xul/accesskey]  R
redo-key = { brand-full-name }
    [xul/key]        Y
cut-menuitem = { brand-full-name }
    [xul/label]      Cut
    [xul/accesskey]  t
cut-key = { brand-full-name }
    [xul/key]        X
copy-menuitem = { brand-full-name }
    [xul/label]      Copy
    [xul/accesskey]  C
copy-key = { brand-full-name }
    [xul/key]        C
paste-menuitem = { brand-full-name }
    [xul/label]      Paste
    [xul/accesskey]  P
paste-key = { brand-full-name }
    [xul/key]        V
delete-menuitem = { brand-full-name }
    [xul/label]      Delete
    [xul/accesskey]  D
delete-key = { brand-full-name }
    [xul/key]        D
select-all-menuitem = { brand-full-name }
    [xul/label]      Select All
    [xul/accesskey]  A
select-all-key = { brand-full-name }
    [xul/key]        A

find-on-menuitem = { brand-full-name }
    [xul/label]      Find in This Page…
    [xul/accesskey]  F
find-on-key = { brand-full-name }
    [xul/key]        f
find-again-menuitem = { brand-full-name }
    [xul/label]      Find Again
    [xul/accesskey]  g
find-again-key1 = { brand-full-name }
    [xul/key]        g
find-again-key2 = { brand-full-name }
    [xul/keycode]    VK_F3
find-selection-key = { brand-full-name }
    [xul/key]        e

bidi-switch-text-direction-menuitem = { brand-full-name }
    [xul/label]      Switch Text Direction
    [xul/accesskey]  w
bidi-switch-text-direction-key = { brand-full-name }
    [xul/key]        X

preferences-menuitem = { brand-full-name }
    [xul/label]      Options
    [xul/accesskey]  O
preferences-menuitem-unix = { brand-full-name }
    [xul/label]      Preferences
    [xul/accesskey]  n


[[ View menu ]]

view-menu = { brand-full-name }
    [xul/label]      View
    [xul/accesskey]  V
view-toolbars-menu = { brand-full-name }
    [xul/label]      Toolbars
    [xul/accesskey]  T
view-sidebar-menu = { brand-full-name }
    [xul/label]      Sidebar
    [xul/accesskey]  e
view-customize-toolbar-menuitem = { brand-full-name }
    [xul/label]      Customize…
    [xul/accesskey]  C

full-zoom-menu = { brand-full-name }
    [xul/label]      Zoom
    [xul/accesskey]  Z
full-zoom-enlarge-menuitem = { brand-full-name }
    [xul/label]      Zoom In
    [xul/accesskey]  I
full-zoom-enlarge-key1 = { brand-full-name }
    [xul/key]        +
full-zoom-enlarge-key2 = { brand-full-name }
    [xul/key]        =
full-zoom-enlarge-key3 = { brand-full-name }
    [xul/key]        ""
full-zoom-reduce-menuitem = { brand-full-name }
    [xul/label]      Zoom Out
    [xul/accesskey]  O
full-zoom-reduce-key1 = { brand-full-name }
    [xul/key]        -
full-zoom-reduce-key2 = { brand-full-name }
    [xul/key]        ""
full-zoom-reset-menuitem = { brand-full-name }
    [xul/label]      Reset
    [xul/accesskey]  R
full-zoom-reset-key1 = { brand-full-name }
    [xul/key]        0
full-zoom-reset-key2 = { brand-full-name }
    [xul/key]        ""
full-zoom-toggle-menuitem = { brand-full-name }
    [xul/label]      Zoom Text Only
    [xul/accesskey]  T

page-style-menu = { brand-full-name }
    [xul/label]      Page Style
    [xul/accesskey]  y
page-style-no-style-menuitem = { brand-full-name }
    [xul/label]      No Style
    [xul/accesskey]  n
page-style-persistent-only-menuitem = { brand-full-name }
    [xul/label]      Basic Page Style
    [xul/accesskey]  b

show-all-tabs-menuitem = { brand-full-name }
    [xul/label]      Show All Tabs
    [xul/accesskey]  A
bidi-switch-page-direction-menuitem = { brand-full-name }
    [xul/label]      Switch Page Direction
    [xul/accesskey]  D

# Match what Safari and other Apple applications use on OS X Lion.
[[ Full Screen controls ]]

enter-full-screen-menuitem = { brand-full-name }
    [xul/label]      Enter Full Screen
    [xul/accesskey]  F
exit-full-screen-menuitem = { brand-full-name }
    [xul/label]      Exit Full Screen
    [xul/accesskey]  F
full-screen-menuitem = { brand-full-name }
    [xul/label]      Full Screen
    [xul/accesskey]  F
full-screen-key = { brand-full-name }
    [xul/key]        f


[[ History menu ]]

history-menu = { brand-full-name }
    [xul/label]        History
    [xul/accesskey]    s
show-all-history-menuitem = { brand-full-name }
    [xul/label]        Show All History
show-all-history-key = { brand-full-name }
    [xul/key]          H
clear-recent-history-menuitem = { brand-full-name }
    [xul/label]        Clean Recent History…
history-synced-tabs-menuitem = { brand-full-name }
    [xul/label]        Synced Tabs
history-restore-last-session-menuitem = { brand-full-name }
    [xul/label]        Restore Previous Session
history-undo-menu = { brand-full-name }
    [xul/label]        Recently Closed Tabs
history-undo-window-menu = { brand-full-name }
    [xul/label]        Recently Closed Windows


[[ Bookmarks menu ]]

bookmarks-menu = { brand-full-name }
    [xul/label]      Bookmarks
    [xul/accesskey]  B
show-all-bookmarks-menuitem = { brand-full-name }
    [xul/label]      Show All Bookmarks
show-all-bookmarks-key = { brand-full-name }
    [xul/key]        b
# [xul/key] should not contain the letters A-F since the are reserved shortcut
# keys on Linux.
show-all-bookmarks-key-gtk = { brand-full-name }
    [xul/key]        o
bookmark-this-page-broadcaster = { brand-full-name }
    [xul/label]      Bookmark This Page
edit-this-page-broadcaster = { brand-full-name }
    [xul/label]      Edit This Page
bookmark-this-page-key = { brand-full-name }
    [xul/key]        d
subscribe-to-page-menuitem = { brand-full-name }
    [xul/label]      Subscribe to This Page…
subscribe-to-page-menupopup = { brand-full-name }
    [xul/label]      Subscribe to This Page…
add-cur-pages-menuitem = { brand-full-name }
    [xul/label]      Bookmark All Tabs…
recent-bookmarks-menuitem = { brand-full-name }
    [xul/label]      Recently Bookmarked

other-bookmarks-menu = { brand-full-name }
    [xul/label]      Other Bookmarks
personalbar-menu = { brand-full-name }
    [xul/label]      Bookmarks Toolbar
    [xul/accesskey]  B


[[ Tools menu ]]

tools-menu = { brand-full-name }
    [xul/label]      Tools
    [xul/accesskey]  T
downloads-menuitem = { brand-full-name }
    [xul/label]      Downloads
    [xul/accesskey]  D
downloads-key = { brand-full-name }
    [xul/key]        j
downloads-key-unix = { brand-full-name }
    [xul/key]        y
addons-menuitem = { brand-full-name }
    [xul/label]      Add-ons
    [xul/accesskey]  A
addons-key = { brand-full-name }
    [xul/key]        A

sync-sign-in-menuitem = { brand-full-name }
    [xul/label]      Sign In To { sync-brand-short-name }…
    [xul/accesskey]  Y
sync-sync-now-menuitem = { brand-full-name }
    [xul/label]      Sync Now
    [xul/accesskey]  S
sync-re-auth-menuitem = { brand-full-name }
    [xul/label]      Reconnect to { sync-brand-short-name }…
    [xul/accesskey]  R
sync-toolbar-button = { brand-full-name }
    [xul/label]      Sync

web-developer-menu = { brand-full-name }
    [xul/label]      Web Developer
    [xul/accesskey]  W

page-source-broadcaster = { brand-full-name }
    [xul/label]      Page Source
    [xul/accesskey]  o
page-source-key = { brand-full-name }
    [xul/key]        u
page-info-menuitem = { brand-full-name }
    [xul/label]      Page Info
    [xul/accesskey]  I
page-info-key = { brand-full-name }
    [xul/key]        i
mirror-tab-menu = { brand-full-name }
    [xul/label]      Mirror Tab
    [xul/accesskey]  m


# browser/locales/en-US/browser/toolbar.ftl

urlbar-textbox = { brand-full-name }
    [xul/placeholder] Search or enter address
    [xul/accesskey]   d


[[ Toolbar items ]]

view-bookmarks-broadcaster = { brand-full-name }
    [xul/label]      Bookmarks
view-bookmarks-key = { brand-full-name }
    [xul/key]        b
view-bookmarks-key-win = { brand-full-name }
    [xul/key]        i

view-history-broadcaster = { brand-full-name }
    [xul/label]      History
view-history-key = { brand-full-name }
    [xul/key]        h
view-tabs-broadcaster = { brand-full-name }
    [xul/label]      Synced Tabs


# browser/branding/official/locales/en-US/brand.ftl

brand-shorter-name    = { brand-short-name }
brand-short-name      =
   *[nominative]        Firefox
    [genitive]          Firefox's
brand-full-name       = { vendor-short-name ->
    [Mozilla]           { vendor-short-name } { brand-shorter-name}
}
vendor-short-name     = Mozilla

trademark-info        = 
  | Firefox and the Firefox logos are trademarks of the Mozilla Foundation.

sync-brand-short-name = Sync
