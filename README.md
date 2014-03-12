# apostrophe

Lightweight name mentions for jQuery (with [underscore.js](http://underscorejs.org)).

_apostrophe_ is a mention system that's tailored to use
**real names** instead of usernames, much like Facebook's
mentions system. That means you dealing with `Jonny Appleseed`
instead of `@jonny_appleseed32`. No triggering characters.

### To be done before stable release:

* Disable name lookup on existing mention
* Undo and cut support
* Mirror overflow (allows usage without textarea autogrow)
* Replace levenshtein by more efficient fuzzy text searching

### To be done eventually

* Optional triggering chars
* Partial tags on deletion (e.g. Jonny Appleseed => Jonny)