/* eslint-disable */
'use strict';

module.exports = {TextEncoderLite: TextEncoderLite, TextDecoderLite: TextDecoderLite};

function TextEncoderLite() {}

function TextDecoderLite() {}

// Taken from https://github.com/feross/buffer/blob/master/index.js
// Thanks Feross et al! :-)

function utf8ToBytes(string, units) {
  units = units || Infinity;
  var codePoint;
  var length = string.length;
  var leadSurrogate = null;
  var bytes = [];
  var i = 0;

  for (; i < length; i++) {
    codePoint = string.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xd7ff && codePoint < 0xe000) {
      // last char was a lead
      if (leadSurrogate) {
        // 2 leads in a row
        if (codePoint < 0xdc00) {
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          leadSurrogate = codePoint;
          continue;
        } else {
          // valid surrogate pair
          codePoint = leadSurrogate - 0xd800 << 10 | codePoint - 0xdc00 | 0x10000;
          leadSurrogate = null;
        }
      } else {
        // no lead yet

        if (codePoint > 0xdbff) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
          continue;
        } else {
          // valid lead
          leadSurrogate = codePoint;
          continue;
        }
      }
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xef, 0xbf, 0xbd);
      leadSurrogate = null;
    }

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(codePoint >> 0x6 | 0xc0, codePoint & 0x3f | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xc | 0xe0);
      bytes.push(codePoint >> 0x6 & 0x3f | 0x80);
      bytes.push(codePoint & 0x3f | 0x80);
    } else if (codePoint < 0x200000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xf0);
      bytes.push(codePoint >> 0xc & 0x3f | 0x80);
      bytes.push(codePoint >> 0x6 & 0x3f | 0x80);
      bytes.push(codePoint & 0x3f | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return bytes;
}

function utf8Slice(buf, start, end) {
  var res = '';
  var tmp = '';
  end = Math.min(buf.length, end || Infinity);
  start = start || 0;

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7f) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i]);
      tmp = '';
    } else {
      tmp += '%' + buf[i].toString(16);
    }
  }

  return res + decodeUtf8Char(tmp);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xfffd); // UTF 8 invalid char
  }
}

TextEncoderLite.prototype.encode = function(str) {
  var result;

  if ('undefined' === typeof Uint8Array) {
    result = utf8ToBytes(str);
  } else {
    result = new Uint8Array(utf8ToBytes(str));
  }

  return result;
};

TextDecoderLite.prototype.decode = function(bytes) {
  return utf8Slice(bytes, 0, bytes.length);
};
