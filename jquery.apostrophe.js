// Apostrophe, lightweight name mentions for jQuery
// Version 0.1
// (c) Syme (git @ symeapp)
// Released under the MIT license

(function($, _) {

  $.apostrophe = {};

  // Default config
  $.apostrophe.config = {

    // Handlers that trigger the update event (separated by spaces)
    eventHandlers: 'input',

    // After how many characters do we start considering a word as a
    // potential name?
    minimalLength: 3,

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
    },

    template: _.template(
      '<ul>' +
        '<% _.each(people, function(person) { %>' +
          '<li data-id="<%= person.id %>"><%= person.name %></li>' +
        '<% }); %>' +
      '</ul>'
    )

  };

  // jQuery function. Makes mirror and bind events.
  $.fn.apostrophe = function(config) {

    // Extend global config with config arguments
    var config = $.extend($.apostrophe.config, config || {});

    // Add unique IDs to people
    _.each(config.people, function(person){ person.id = _.uniqueId(); });

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
        el.mentionned = [];
        el.charCount  = el.value.length;
        el.config     = config;
        el.mirror     = $mirror.get(0);

        // Bind events
        $el
          .on(config.eventHandlers, $.apostrophe.update)
          .on('keyup click', $.apostrophe.caretPositionChanged)
          .on('apostrophe.update', $.apostrophe.update)
          .on('apostrophe.destroy', function(){
            $el
              .off(config.eventHandlers, $.apostrophe.update)
              .off('keyup click', $.apostrophe.caretPositionChanged)
              .off('apostrophe.update')
              .removeProp('mirror');
            $mirror.remove();
          });

      });

    // Chainability
    return this;

  };

  // Update mirror and check for mentionned names.
  $.apostrophe.update = function(e) {

    var el            = this,
        charIndex     = el.selectionStart <= 0 ? 0 : el.selectionStart,
        charDiff      = el.value.length - el.charCount;

    // Update charCount now that we now charDiff
    el.charCount = el.value.length;

    // If characters have been added, check if a mention
    // has been severed.
    if ( charDiff >= 0 ) {

      // Has a mention been severed?
      var overlappingPerson = _.find(el.mentionned, function(person){
        return charIndex - charDiff > person.pos &&
          charIndex - charDiff < person.pos + person.name.length;
      });

      // If it is the case, pass the mentionned name from
      // the names to the people list
      if (overlappingPerson) {
        el.config.people.push(overlappingPerson);
        el.mentionned = _.reject(el.mentionned, function(p){
          return p.name == overlappingPerson.name;
        });
      }

    // If characters have been deleted, check if one or
    // several mentions have been severed.
    } else {

      var oldPos = charIndex - charDiff,
          newPos = charIndex;

      _.any(el.mentionned, function(person) {

        var nameStart = person.pos,
            nameEnd   = person.pos + person.name.length;

        var isSevered =
          (newPos < nameStart && oldPos > nameStart && oldPos < nameEnd) || // left
          (newPos > nameStart && newPos < nameEnd && oldPos > nameEnd) || // right
          (newPos >= nameStart && oldPos <= nameEnd) || // inside
          (newPos <= nameStart && oldPos >= nameEnd); // outside

        if (isSevered) {
          el.config.people.push(person);
          el.mentionned = _.reject(el.mentionned, function(p){
            return p.name == person.name;
          });
        }

      });

    }

    // Update positions
    var furtherPeople = _.filter(el.mentionned, function(person){
      return person.pos >= charIndex - charDiff ;
    });
    _.each(furtherPeople, function(person){ person.pos = person.pos + charDiff; });

    // Check if any name has been inputted
    $.apostrophe.checkForName.call(el, charIndex);

    // Add the highlight tags in the mirror copy
    var formatted_content = el.value;
    _.each(_.flatten(_.indexBy(el.mentionned, 'pos')), function(person, i) {

      // 7 characters are added by "<b></b>". We add them linearly
      // following the sorted mentions index order, thus: i * 7
      var nameIndex = person.pos + i * 7;

      formatted_content = [
        formatted_content.slice(0, nameIndex),
        '<b>' + person.name + '</b>',
        formatted_content.slice(nameIndex + person.name.length)
      ].join('');

    });

    // Push HTML-linebreaked content to the mirror
    el.mirror.innerHTML = formatted_content.replace(/\n/g, "<br/>");

  };

  $.apostrophe.checkForName = function(charIndex){

    var el = this;

    // Get current word with enclosing text at caret position
    var parts = $.apostrophe.getParts(this.value, charIndex);

    // Does the current word look like a name?
    var isLongEnough = parts.word.length >= el.config.minimalLength;

    var isOutsideMentions = !_.any(el.mentionned, function(person) {
      return charIndex >= person.pos &&
        charIndex <= person.pos + person.name.length;
    });

    // Are there names that ressemble it?
    var potentialPeople = _.filter(el.config.people, function(person){
      return _.any(person.name.split(' '), function(partOfName){

        // Prepare parts for match testing
        var a = parts.word.toLowerCase(), b = partOfName.toLowerCase();

        // Jaro-winkler distance to rank
        var score = $.apostrophe.distance(a, b);
        return score > 0.8 ? score : false;

      });
    });

    // If there are resembling names, trigger dropdown.
    // BEGIN: TO REFACTOR

    if ( isLongEnough && isOutsideMentions && potentialPeople.length > 0 ) {

      var popup_template = el.config.template({ people: potentialPeople });
      $('#popup-container').html(popup_template);

      $('#popup-container li').click(function(){
        var personId  = $(this).data('id').toString(),
            person    = _.findWhere(el.config.people, { id: personId });
        $.apostrophe.placeName.call(el, person, parts);
      });

    } else {
      $('#popup-container').html('');
    }

    // END: TO REFACTOR

  };

  $.apostrophe.placeName = function (selectedPerson, parts) {

    var el = this;

    var before  = parts.before,
        word    = parts.word,
        after   = parts.after;

    // Update textarea with selected name
    el.value = before + selectedPerson.name + after;

    // Update charCount
    el.charCount = el.value.length;

    // Push further mentionned people
    var furtherPeople = _.filter(el.mentionned, function(person){
      return person.pos >= before.length ;
    });
    _.each(furtherPeople, function(person){
      person.pos = person.pos - word.length + selectedPerson.name.length;
    });

    // Pass the mentionned name from the names to the mentionned list
    el.mentionned.push( _.extend(selectedPerson, { pos: before.length }) );
    el.config.people = _.reject(el.config.people, function(person){
      return person.name == selectedPerson.name;
    });

    // Place the text caret after the mentionned name
    var newCaretPos = before.length + selectedPerson.name.length;
    el.setSelectionRange(newCaretPos, newCaretPos);

    // Update the textarea
    $(el).trigger('apostrophe.update');

    return true;

  };

  $.apostrophe.caretPositionChanged = function(e) {

    var el = this;

    var keycodes = $.apostrophe.config.keycodes,
        arrowKeys = [keycodes.UP, keycodes.RIGHT, keycodes.DOWN, keycodes.LEFT];

    if ( _.contains(arrowKeys, e.which) || e.type =="click") {
      var charIndex = el.selectionStart <= 0 ? 0 : el.selectionStart;
      $.apostrophe.checkForName.call(el, charIndex);
    }

  };

  // Given a string 'content', and an index in it 'charIndex',
  // Will return the current word, the string before it, and
  // the string after it.
  $.apostrophe.getParts = function(content, charIndex) {

    var before  = content.substr(0, charIndex),
        after   = content.substr(charIndex);

    var leftPart = '', rightPart = '';

    for (var i = before.length; i > 0; i--) {
      if (/\s/g.test(before[i - 1])) {
        before = before.slice(0, i); break;
      } else leftPart = before[i - 1] + leftPart;
    }

    for (var j = 0; j < after.length; j++) {
      if (/\s/g.test(after[j])) {
        after = after.slice(j, after.length); break;
      } else rightPart += after[j];
    }

    var word = leftPart + rightPart;
    if (before == word) before = "";

    return { before: before, word: word, after: after };

  };

  // Polyfill helper to get computed styles
  // 'el' should be a DOM element, and 'props' an array of
  // CSS properties or a string of a single property .
  $.apostrophe.getStyles = function (el, props) {

    var results = {};
    if (typeof props === "string") props = [props];

    $.each(props, function(i, prop) {
      if (el.currentStyle) {
        results[prop] = el.currentStyle[prop];
      } else if (window.getComputedStyle) {
        results[prop] = document.defaultView
          .getComputedStyle(el, null)
          .getPropertyValue(prop);
      } else {
        results[prop] = $(el).css(prop);
      }
    });

    return results;

  };

  // Jaro-winkler distance
  // https://github.com/zdyn/jaro-winkler-js
  $.apostrophe.distance = function(a, c) {
    var h,b,d,k,e,g,f,l,n,m,p;a.length>c.length&&
    (c=[c,a],a=c[0],c=c[1]);k=~~Math.max(0,c.length/2-1);e=[];g=[];b=n=0;for(p=a.length;n<p;b=++n)
    for(h=a[b],l=Math.max(0,b-k),f=Math.min(b+k+1,c.length),d=m=l;l<=f?m<f:m>f;d=l<=f?++m:--m)
    if(null==g[d]&&h===c[d]){e[b]=h;g[d]=c[d];break}e=e.join("");g=g.join("");if(d=e.length){b=f=k=0;
    for(l=e.length;f<l;b=++f)h=e[b],h!==g[b]&&k++;b=g=e=0;for(f=a.length;g<f;b=++g)if(h=a[b],h===c[b])
    e++;else break;a=(d/a.length+d/c.length+(d-~~(k/2))/d)/3;a+=0.1*Math.min(e,4)*(1-a)}else a=0;return a;
  }

})(jQuery, _);