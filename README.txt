Safety Duck

Safety Duck is a Firefox extension that allows for the tagging of images that may cause various "triggers", and hides them when they are references on a web page.

Supports a "dynamic" list of rules/channels/reasons for an image to be blocked.  This is currently coded into the safetyduck object as an array, but is easily changed to read the data from elsewhere.
When an image is blocked for a reason/channel, the name is checked in the popup menu.
Images can be blocked for multiple reasons and will be displayed once all the reasons are removed.

TODO:
Decide on terminology... >_>  And then refactor some of the code to be consistent
Build the preferences interface so that channels can be added there.
Include a way to "watch" channels, so that images can be flagged but still visible.
Build a way to have local + remote blacklists.
Build a local whitelist(?) for images blocked remotely that the user wants to see.