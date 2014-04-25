var fs        = require('fs'),
    system    = require('system');

var urlSource = '',
    domain    = '',
    callCount = 0;

// sys args
if (system.args.length === 1) {
  console.log('Usage: arhive.js <some URL>');
  console.log('Usage: arhive.js <some file> file');
  console.log('Usage: arhive.js <some domain> sitemap');
  phantom.exit();
} else {
  domain = system.args[1];
}

if (system.args.length === 3) {
  urlSource = system.args[2];
}

if (urlSource !== 'file' && domain.indexOf('http://') === -1 && domain.indexOf('https://') === -1) {
  console.log('Domain must include a protocol, either HTTP or HTTPS');
  console.log('was: ' + domain);
  phantom.exit();
}
// end sys args

var parseXml = function (xmlString) {
  return (new window.DOMParser()).parseFromString(xmlString, "text/xml");
};

var urlsFromSitemap = function (content) {
  var xmlDoc = parseXml(content),
      locs = xmlDoc.getElementsByTagName('loc'),
      urls = [],
      i    = null,
      url  = null ;

  for (i = 0; i < locs.length; i += 1) {
    url = locs[i].childNodes[0].nodeValue;
    urls.push(url);
  }
  return urls;
};

// Remove query string from each URL and return unique URLs
var filterUniq = function(urls) {
  var urlsObj      = {},
      i            = null,
      url          = null,
      paramIndex   = null,
      filteredUrls = [],
      filteredURL  = null;

  for (i = 0; i < urls.length; i += 1) {
    url = urls[i].split('?')[0]; // Remove all URL params
    urlsObj[url] = url;
  }
  for (filteredURL in urlsObj) {
    if (urlsObj.hasOwnProperty(filteredURL)) {
      filteredUrls.push(filteredURL);
    }
  }
  return filteredUrls;
};

var archivePage = function(url, maxCalls) {
  var page = require('webpage').create();
  page.open('https://web.archive.org/save/' + url, function() {
    callCount += 1;
    if (callCount === maxCalls){
      console.log('Sent ' + callCount + ' URLs to the Internet Archive');
      phantom.exit();
    } else {
      console.log('Sent ' + callCount + ' of ' + maxCalls + '     url: ' + url);
    }
    page.close();
  });
};

var fileLines = function(filePath) {
  var content = '',
      f       = null,
      res     = [],
      lines   = null,
      i       = 0,
      eol     = system.os.name === 'windows' ? "\r\n" : "\n";

  try {
    f       = fs.open(filePath, "r");
    content = f.read();
  } catch (e) {
    console.log(e);
  }
  if (f) {
    f.close();
  }

  if (content) {
    lines = content.split(eol);
    for (i = 0; i < lines.length; i += 1) {
      if (lines[i].length > 0) {
        res.push(lines[i]);
      }
    }
  }
  return res;
};

var run = function() {
  var urls = null;
  if (urlSource === 'sitemap') {
    console.log('Getting /sitemap.xml');
    var sitemap = require('webpage').create();
    sitemap.open(domain + "/sitemap.xml", function(status) {
      if(status !== "success") {
        console.log("Unable to open sitemap.");
        console.log("Exiting.");
        phantom.exit();
      } else {
        urls = filterUniq(urlsFromSitemap(sitemap.content));
        for (i = 0; i < urls.length; i += 1) {
          archivePage(urls[i], urls.length);
        }
      }
    });
  } else if (urlSource === 'file') {
    console.log('Archiving all URLS in file');
    urls = filterUniq(fileLines(domain));
    for (i = 0; i < urls.length; i += 1) {
      archivePage(urls[i], urls.length);
    }
  } else {
    console.log('Submitting URL');
    urls = [domain];
    for (i = 0; i < urls.length; i += 1) {
      archivePage(urls[i], urls.length);
    }
  }
};

run();
