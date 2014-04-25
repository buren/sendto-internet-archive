'use strict';

var fs        = require('fs'),
    system    = require('system');

var urlSource = '',
    domain    = '',
    callCount = 0;

if (system.args.length === 1) {
  console.log('Usage: arhive.js <some domain>');
  console.log('Usage: arhive.js <some file> file');
  phantom.exit();
}else {
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

var parseXml = function(xmlString) {
  return (new window.DOMParser()).parseFromString(xmlString, "text/xml");
};

var urlsFromSitemap = function (content) {
  var xmlDoc = parseXml(content);
  var locs = xmlDoc.getElementsByTagName('loc');
  var urls = [];
  for (var i = 0; i < locs.length; i++) {
    var url = locs[i].childNodes[0].nodeValue;
    urls.push(url);
  };
  return urls;
};

// Remove query string from each URL and return unique URLs
var filterUniq = function(urls) {
  var urlsObj = {};
  for (var i = 0; i < urls.length; i++) {
    var url = urls[i];
    var paramIndex = urls[i].indexOf('?');
    if (paramIndex !== -1) {
      url = urls[i].substr(0, paramIndex);
    }
    urlsObj[url] = url;
  }
  var filteredUrls = [];
  for (var url in urlsObj) {
    if (urlsObj.hasOwnProperty(url)) {
      filteredUrls.push(url);
    }
  }
  return filteredUrls;
};

var archivePage = function(url, maxCalls) {
  var page = require('webpage').create();
  page.open('https://web.archive.org/save/' + url, function(status) {
    callCount++;
    if (callCount === maxCalls){
      console.log('Sent ' + callCount + ' URLs to the Internet Archive');
      phantom.exit();
    } else {
      console.log('Sent ' + callCount + ' of ' + maxCalls);
    }
    page.close();
  });
};

var archivePages = function(archiveUrls) {
  var urls = filterUniq(archiveUrls);
  for (var i = 0; i < urls.length; i++) {
    archivePage(urls[i], urls.length)
  };
};

var fileLines = function(filePath) {
  var content = '',
      f       = null,
      res     = [],
      lines   = null,
      eol     = system.os.name == 'windows' ? "\r\n" : "\n";

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
    for (var i = 0, len = lines.length; i < len; i++) {
      if (lines[i].length > 0) {
        res.push(lines[i]);
      }
    }
  }
  return res;
};

if (urlSource == 'sitemap') {
  var sitemap = require('webpage').create();
  sitemap.open(domain + "/sitemap.xml", function(status) {
    if(status !== "success") {
      console.log("Unable to open sitemap.");
      console.log("Exiting.");
      phantom.exit();
    } else {
      archivePages(urlsFromSitemap(sitemap.content));
    }
  });
} else if (urlSource == 'file') {
  var urls = fileLines(domain);
  archivePages(urls);
} else {
  archivePages([domain]);
}
