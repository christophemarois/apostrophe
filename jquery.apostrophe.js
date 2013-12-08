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
      BACKSPACE:  8,    TAB:    9,
      COMMA:      188,  SPACE:  32,
      RETURN:     13,   ESC:    27,
      LEFT:       37,   UP:     38,
      RIGHT:      39,   DOWN:   40
    }

  };

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

        // Link the config to the DOM textarea, and
        // link the DOM mirror as an attribute to the textarea.
        el.config = config;
        el.mirror = $mirror.get(0);

        $el
          // Update event
          .on(config.eventHandlers, $.apostrophe.updateContent)

          // Destroy event
          .on('apostrophe.destroy', function(){
            $el
              .off(config.eventHandlers, $.apostrophe.updateContent)
              .removeProp('mirror');
            $mirror.remove();
          });

      });

    // Chainability
    return this;

  };

  // Update content event.
  $.apostrophe.updateContent = function(e) {

    var config = this.config;

    // Calculate index of inputted character
    var charIndex   = this.selectionStart <= 0 ? 0 : this.selectionStart;

    // Split the text before and after the text caret.
    var textBefore = this.value.substr(0, charIndex),
        textAfter  = this.value.substr(charIndex);

    var leftPart = '', rightPart = '';

    for (var i = textBefore.length - 1; i > 0; i--) {
      if (/\s/g.test(textBefore[i])) {
        textBefore = textBefore.slice(0, i + 1); break;
      } else leftPart = textBefore[i] + leftPart;
    }

    for (var j = 0; j < textAfter.length; j++) {
      if (/\s/g.test(textAfter[j])) {
        textAfter = textAfter.slice(j, textAfter.length); break;
      } else rightPart += textAfter[j];
    }

    var currentWord = leftPart + rightPart;

    // Does the current word look like a name?
    var looksLikeName = /^[A-Z]/.test(currentWord) &&
      currentWord.length >= config.minimalLength;

    // Are there names that ressemble it?
    var potentialNames = _.filter(_.keys(config.people), function(name){
      return _.any(name.split(' '), function(partOfName){

        // If currentWord is a perfect match of the beggining
        // of partOfName, pass, otherwise, try a levenshtein distance
        return (new RegExp('^' + currentWord)).test(partOfName) ||
          _.str.levenshtein(currentWord, partOfName) <= config.levenshtein;

      });
    });

    if ( looksLikeName && potentialNames.length > 0 ) {

      /*
      HERE WILL GO THE DROPDOWN PART.
      FOR DEVELOPMENT PURPOSES, WE ASSUME THAT THE USER CHOSE THE FIRST RESULT
      */
      var selectedName = potentialNames[0];

      // DEVELOPMENT: DO ONLY ONE MATCHING BY PAGELOAD
      if(typeof first !== "undefined") return; first = true;

      // Update source and mirror text (currently flawed).
      this.value = textBefore + selectedName + textAfter;
      var html_value = textBefore + '<b>' + selectedName + '</b>' + textAfter;

      // Place the text caret after the mentionned name
      var newCaretPos = textBefore.length + selectedName.length;
      this.setSelectionRange(newCaretPos, newCaretPos);

    }

    // Push HTML-linebreaked content to the mirror
    this.mirror.innerHTML = html_value || this.value.replace(/\n/g, "<br/>");

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