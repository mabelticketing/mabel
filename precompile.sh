mkdir -p ./assets && jade ./views/index.jade > ./assets/index.html
mkdir -p ./assets/dash && jade ./views/dash.jade > ./assets/dash/index.html
mkdir -p ./assets/book && jade ./views/book.jade > ./assets/book/index.html
mkdir -p ./assets/admin && jade ./views/admin/dash.jade > ./assets/admin/index.html
mkdir -p ./assets/admin/event && jade ./views/admin/event.jade > ./assets/admin/event/index.html
mkdir -p ./assets/admin/tickets && jade ./views/admin/tickets.jade > ./assets/admin/tickets/index.html
mkdir -p ./assets/admin/transactions && jade ./views/admin/transactions.jade > ./assets/admin/transactions/index.html
mkdir -p ./assets/admin/users && jade ./views/admin/users.jade > ./assets/admin/users/index.html
