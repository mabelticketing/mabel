parallelshell \
  'jade --watch -O mabel.json -p views/index.jade > public/index.html' \
  'jade --watch -O mabel.json -p views/dash.jade > public/dash/index.html' \
  'jade --watch -O mabel.json -p views/book.jade > public/book/index.html' \
  'jade --watch -O mabel.json -p views/admin/dash.jade > public/admin/index.html' \
  'jade --watch -O mabel.json -p views/admin/event.jade > public/admin/event/index.html' \
  'jade --watch -O mabel.json -p views/admin/tickets.jade > public/admin/tickets/index.html' \
  'jade --watch -O mabel.json -p views/admin/transactions.jade > public/admin/transactions/index.html' \
  'jade --watch -O mabel.json -p views/admin/users.jade > public/admin/users/index.html'
