var express = require('express'),
  request = require('request'),
  argv = require('minimist')(process.argv.slice(2)),
  port = argv.port || 3001,
  cors = require('cors'),
  Q = require('q'),
  locales = ["en-US", "sv", , "pt"],
  app = express();

var PALETTES = {};
var STRINGS = {};
var SPACE_ID = "e57oes5xh817";
var TOKEN = "b51319b2b4173382a851bfa441e8aa3fab4e99ab341a51f046c23d878221d537";

//Middleware CORS
app.use(cors());

//return palettes for Vizabi
app.get('/palettes', function (req, res) {
  return res.send(PALETTES);
});

app.get('/strings', function (req, res) {
  return res.send(STRINGS);
});

app.get('/strings/:locale', function (req, res) {
  var locale = req.param('locale');
  if (!STRINGS[locale]) return res.send(STRINGS);
  return res.send(STRINGS[locale]);
});


//server
app.listen(port, function () {
  console.log('Vizabi Server listening at port', port);
});

/*
 * main function to be executed at first
 */
(function main() {
  getFromContentful();
  //request update every minute
  setInterval(function() {
    getFromContentful();
  }, 60000);
})();


/*
 * request promise
 * @returns {Promise}
 */
function requestPromise(url) {
  var defer = Q.defer();
  request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        defer.resolve(JSON.parse(body));
      }
      else {
         defer.reject();
      }
  });

  return defer.promise;
}

/*
 * request palettes
 * @returns {Promise}
 */
function requestPalettes() {
  var url = "https://cdn.contentful.com/spaces/"+ SPACE_ID + "/entries?access_token=" + TOKEN + "&content_type=palette";
  return requestPromise(url);
}

/*
 * request strings
 * @param {String} locale
 * @returns {Promise}
 */
function requestStrings(locale) {
  var url = "https://cdn.contentful.com/spaces/"+ SPACE_ID + "/entries?access_token=" + TOKEN + "&content_type=vizabi_string&locale="+locale;
  return requestPromise(url);
}

/*
 * parses palette response
 */
function formatPalettes(contentfulResponse) {
  var obj = {};
  contentfulResponse.items.forEach(function(item) {
    var id = item.fields.id;
    var colors = item.fields.colors;
    obj[id] = colors;
  });
  return obj;
}

/*
 * parses string response
 */
function formatStrings(contentfulResponse) {
  var obj = {};
  contentfulResponse.items.forEach(function(item) {
    var id = item.fields.id;
    var string = item.fields.string;
    obj[id] = string;
  });
  return obj;
}


/*
 * get all info necessary for gapminder vizabi
 */
function getFromContentful() {

  requestPalettes().then(function(results) {
    PALETTES = formatPalettes(results);
  });

  locales.forEach(function(locale) {
    requestStrings(locale).then(function(results) {
      STRINGS[locale] = formatStrings(results);
    });
  });
}
