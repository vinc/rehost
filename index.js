/*eslint-env node*/

var request = require('request');
var base64 = require('base64-url');
var sharp = require('sharp');

module.exports = function(options) {
  return function(req, res, next) {
    var args = Object.assign(req.query, req.params, options || {});
    req.format = args.format;
    req.rehost = args.rehost;
    req.resize = args.resize;

    var url = base64.decode(req.rehost);
    var geo = /(\d*)x(\d*)(!)?/.exec(req.resize || 'x');
    var width  = Number(geo[1]) || null;
    var height = Number(geo[2]) || null;
    var crop = geo[3] == '!';

    var resizer = sharp().
      resize(width, height).
      sharpen().
      withoutEnlargement();

    if (!crop) {
      resizer = resizer.max();
    }

    switch (req.params.ext) {
    case 'jpg':
    case 'jpeg':
      resizer = resizer.jpeg({ quality: 90 });
      break;
    case 'png':
      resizer = resizer.png();
      break;
    }

    if (options.logger) {
      options.logger('FETCH ' + url);
    }

    try {
      request(url, { timetout: 10000 }).
        on('error', next).
        pipe(resizer).
        on('error', next).
        pipe(res).
        on('error', next);
    } catch(err) {
      next(err);
    }
  };
};
