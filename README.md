# sendto-internet-archive
Send URLs to archive.org from URL, URL list or /sitemap.xml.

## Usage
```bash
# Send one URL to Internet Archive
$ phantomjs archive.js https://www.example.com/

# Archive all URLs listed in a local file (one URL on each line)
$ phantomjs archive.js <path_to_file> file

# Archive all URLs present in /sitemap.xml
$ phantomjs archive.js https://www.example.com/ sitemap
```
View domain archive: https://web.archive.org/web/*/http://example.com

## Note
Currently the script crashes when reaching ~100 URLs.

Bug described in https://github.com/ariya/phantomjs/issues/10560.

## License
[MIT License](https://github.com/buren/sendto-internet-archive/blob/master/LICENSE)
