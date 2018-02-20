define([
  'core/js/adapt',
  './jquery.a11y.js'
], function(Adapt, jqueryA11y) {

  function walk(endPoint, filter) {
    for (var k in endPoint) {
      var val = endPoint[k];
      var type = typeof val;
      var nul = val === null;
      if (!nul && type === "object") {
        walk(endPoint[k], filter);
        continue;
      }
      if (type !== "string") continue;
      endPoint[k] = filter(val);
    }
  }

  var unescape = (function() {
    var regexCache = {};
    var all;
    var charSets = {
      default: {
        '&quot;': '"',
        '&#34;': '"',

        '&apos;': '\'',
        '&#39;': '\'',

        '&amp;': '&',
        '&#38;': '&',

        '&gt;': '>',
        '&#62;': '>',

        '&lt;': '<',
        '&#60;': '<'
      },
      extras: {
        '&cent;': '¢',
        '&#162;': '¢',

        '&copy;': '©',
        '&#169;': '©',

        '&euro;': '€',
        '&#8364;': '€',

        '&pound;': '£',
        '&#163;': '£',

        '&reg;': '®',
        '&#174;': '®',

        '&yen;': '¥',
        '&#165;': '¥'
      }
    };
    charSets.all = function() {
      return all || (all = extend({}, charSets.default, charSets.extras));
    };
    function unescape(str, type) {
      if (!isString(str)) return '';
      var chars = charSets[type || 'default'];
      var regex = toRegex(type, chars);
      return str.replace(regex, function(m) {
        return chars[m];
      });
    }
    function toRegex(type, chars) {
      if (regexCache[type]) {
        return regexCache[type];
      }
      var keys = Object.keys(chars).join('|');
      var regex = new RegExp('(?=(' + keys + '))\\1', 'g');
      regexCache[type] = regex;
      return regex;
    }
    function isString(str) {
      return str && typeof str === 'string';
    }
    unescape.chars = charSets.default;
    unescape.extras = charSets.extras;
    unescape.all = function() {
      return charSets.all();
    };
    return unescape;
  })();

  $.ajaxSetup({
    dataFilter: preprocess
  });

  function preprocess(data, type) {
    if (type !== "json") return data;

    var json = JSON.parse(data);

    walk(json, function(value) {
      value = value.replace(/^\s*/, "").replace(/\s*$/, ""); /// trim whitespace
      value = value.replace(/\n/g, ""); // remove returns
      // check for the number of p tags and remove singular wrappers
      var openP = value.match(/\<p\>/g);
      if (openP && openP.length === 1 && value.slice(0,3) === "<p>" && value.slice(-4) === "</p>") {
        value = value.slice(3,-4);
      }
      value = unescape(value);// remove html escaping
      value = value.replace(/^\s*/, "").replace(/\s*$/, ""); /// trim whitespace
      return value;
    });

    return JSON.stringify(json);

  }

});
