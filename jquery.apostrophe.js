// Apostrophe, lightweight name mentions for jQuery
// Version 0.1
// (c) Syme (git @ symeapp)
// Released under the MIT license

(function($) {

  $.apostrophe = {};

  // Default config
  $.apostrophe.config = {

    // Handlers that trigger the update event (separated by spaces)
    eventHandlers: 'keydown keypress input change blur',

    // Computed textarea styles that have to be copied to the mirror.
    mirroredStyles: [
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'border-top', 'border-right', 'border-bottom', 'border-left',
      'font-family', 'font-size', 'font-weight', 'font-style',
      'letter-spacing', 'text-transform', 'word-spacing','text-indent',
      'line-height'
    ]

  };

  $.fn.apostrophe = function(config) {

    // Extend global config with config arguments
    config = $.extend($.apostrophe.config, config || {});

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

        // Link the DOM mirror as an attribute to the textarea.
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

    // Translate linebreaks to html
    var html_value = this.value.split("\n").join("<br/>");

    // Styling example
    html_value = html_value
      .replace(/Christophe/g, '<span>Christophe</span>');

    // Push updated content to the mirror
    this.mirror.innerHTML = html_value;

  };

  // Polyfill helper to get computed styles
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

})(jQuery);