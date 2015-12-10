#!/bin/bash

jade views/client -O mabel.json -o public --hierarchy --pretty;
# TODO: admin pages...

# move (...).html to /(...)/index.html  (except index.html)
find public -name "*.html" | grep -v index | while read f; 
	do 
		mkdir -p "${f/.html/}";
		mv "$f" "${f/.html/}/index.html";
	done;
