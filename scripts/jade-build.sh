#!/bin/bash

jade views/client -O mabel.json -o public --hierarchy --pretty;
jade views/admin/*.jade -O mabel.json -o public/admin --hierarchy --pretty;

# move (...).html to /(...)/index.html  (except index.html)
find public -name "*.html" | grep -v index | while read f; 
	do 
		mkdir -p "${f/.html/}";
		mv "$f" "${f/.html/}/index.html";
	done;

mv public/admin/dash/index.html public/admin/index.html;
rm -r public/admin/dash;