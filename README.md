# apostrophe

Lightweight name mentions for jQuery (with [underscore.js](http://underscorejs.org)).

_apostrophe_ is a mention system that's tailored to use
**real names** instead of usernames, much like Facebook's
mentions system. That means you dealing with `Jonny Appleseed`
instead of `@jonny_appleseed32`. No triggering characters.

## To be done before stable release:

* Update name lookup when manually changing cursor position (arrows or click)
* Undo and cut support
* Bug: deletion of mention that starts at content's beggining
  or ends at content's end often fails
* Mirror overflow (allows usage without textarea autogrow)
* Replace levenshtein by more efficient fuzzy text searching

## To be


* Optional triggering chars

### Low priority

* Partial tags on deletion (e.g. Jonny Appleseed => Jonny)