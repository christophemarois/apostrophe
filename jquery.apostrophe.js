// Apostrophe, lightweight name mentions for jQuery
// Version 0.1
// (c) Syme (git @ symeapp)
// Released under the MIT license

(function($, _) {

  $.apostrophe = {};

  // Mixin string functions to underscore
  _.mixin(_.str.exports());

  // Default config
  $.apostrophe.config = {

    // Handlers that trigger the update event (separated by spaces)
    eventHandlers: 'input',

    // After how many characters do we start considering a word as a
    // potential name?
    minimalLength: 3,

    // How close to a name should the levenshtein distance be
    // to be considered as a possibility?
    // From 0 to 2, 0 being exact maching and 2 being permissive.
    levenshtein: 1,

    // Computed textarea styles that have to be copied to the mirror.
    mirroredStyles: [
      'margin-top',     'margin-right',   'margin-bottom',  'margin-left',
      'padding-top',    'padding-right',  'padding-bottom', 'padding-left',
      'border-top',     'border-right',   'border-bottom',  'border-left',
      'font-family',    'font-size',      'font-weight',    'font-style',
      'letter-spacing', 'text-transform', 'word-spacing',   'text-indent',
      'line-height'
    ],

    // Verbose enum keycodes
    keycodes: {
      BACKSPACE:  8 , TAB:   9 ,  COMMA: 188,  SPACE:  32,
      RETURN:     13, ESC:   27,  LEFT:  37 ,  UP:     38,
      RIGHT:      39, DOWN:  40
    }

  };

  // jQuery function. Makes mirror and bind events.
  $.fn.apostrophe = function(config) {

    // Extend global config with config arguments
    var config = $.extend($.apostrophe.config, config || {});

    this
      // Keep only uninitialized textareas
      .filter('textarea')
      .filter(function(){ return !this.mirror })

      // Iterate on each
      .each(function(){

        // Shortcuts to DOM and jQuery versions of textarea
        var el = this, $el = $(this);

        // Get textarea position and dimensions
        var posAndDims = {
          top:    $el.offset().top, left:   $el.offset().left,
          width:  $el.outerWidth(), height: $el.outerHeight()
        }

        // Merge them with the computed styles that matter
        var style = $.extend(posAndDims,
          $.apostrophe.getStyles(el, config.mirroredStyles));

        // Create mirror, style it and append it to body
        var $mirror = $('<div class="apostrophe-mirror" />')
          .css(style).appendTo('body');

        // Initialize element DOM properties
        el.mentionned = {};
        el.config     = config;
        el.mirror     = $mirror.get(0);

        $el
          // Update event
          .on(config.eventHandlers, $.apostrophe.updateAndCheck)

          // Destroy event
          .on('apostrophe.destroy', function(){
            $el
              .off(config.eventHandlers, $.apostrophe.updateAndCheck)
              .removeProp('mirror');
            $mirror.remove();
          });

      });

    // Chainability
    return this;

  };

  // Update mirror and check for mentionned names.
  $.apostrophe.updateAndCheck = function(e) {

    var config = this.config;

    // Get current word with enclosing text at caret position
    var charIndex = this.selectionStart <= 0 ? 0 : this.selectionStart,
        parts     = $.apostrophe.getParts(this.value, charIndex);

    // Does the current word look like a name?
    var looksLikeName = /^[A-Z]/.test(parts.word) &&
      parts.word.length >= config.minimalLength;

    // Are there names that ressemble it?
    var potentialNames = _.filter(_.keys(config.names), function(name){
      return _.any(name.split(' '), function(partOfName){

        var isMatch       = (new RegExp('^' + parts.word)).test(partOfName),
            isLevenshtein = _.str.levenshtein(parts.word, partOfName) <= config.levenshtein;

        return isMatch || isLevenshtein;

      });
    });

    // DEVELOPMENT: AUTOMATICALLY PUT FIRST RESULT
    if ( looksLikeName && potentialNames.length > 0 )
      var html = $.apostrophe.placeName.call(this,
        potentialNames[0], parts.before, parts.after);

    // Push HTML-linebreaked content to the mirror
    this.mirror.innerHTML = html || this.value.replace(/\n/g, "<br/>");

  };

  $.apostrophe.getParts = function(content, charIndex) {

    var before  = content.substr(0, charIndex),
        after   = content.substr(charIndex);

    var leftPart = '', rightPart = '';

    for (var i = before.length - 1; i > 0; i--) {
      if (/\s/g.test(before[i])) {
        before = before.slice(0, i + 1); break;
      } else leftPart = before[i] + leftPart;
    }

    for (var j = 0; j < after.length; j++) {
      if (/\s/g.test(after[j])) {
        after = after.slice(j, after.length); break;
      } else rightPart += after[j];
    }

    return { before: before, word: leftPart + rightPart, after: after };

  };

  $.apostrophe.placeName = function (selectedName, before, after) {

    // DEVELOPMENT: DO ONLY ONE MATCHING BY PAGELOAD
    if(typeof first !== "undefined") return; first = true;

    // Update textarea with selected name
    this.value = before + selectedName + after;

    // Pass the mentionned name from the names to the mentionned list
    this.mentionned[selectedName] = this.config.names[selectedName];
    this.config.names = _.omit(this.config.names, selectedName);

    // Add the index of the name's beginning to the object
    this.mentionned[selectedName].pos = before.length;

    // Place the text caret after the mentionned name
    var newCaretPos = before.length + selectedName.length;
    this.setSelectionRange(newCaretPos, newCaretPos);

    // Return formatted content to mirror
    return before + '<b>' + selectedName + '</b>' + after;

  };

  // Polyfill helper to get computed styles
  // 'el' should be a DOM element, and 'props' an array of
  // CSS properties or a string of a single property .
  $.apostrophe.getStyles = function (el, props) {

    var results = {};
    if (typeof props === "string") props = [props];

    $.each(props, function(i, prop) {
      if (el.currentStyle)
        results[prop] = el.currentStyle[prop];
      else if (window.getComputedStyle)
        results[prop] = document.defaultView
          .getComputedStyle(el, null)
          .getPropertyValue(prop);
    });

    return results;

  }

})(jQuery, _);