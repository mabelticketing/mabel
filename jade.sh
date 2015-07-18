mkdir -p ./assets && jade ./views/index.jade > ./assets/index.html && rm ./views/index.html
mkdir -p ./assets/dash && jade ./views/dash.jade > ./assets/dash/index.html && rm ./views/dash.html
mkdir -p ./assets/book && jade ./views/book.jade > ./assets/book/index.html && rm ./views/book.html
mkdir -p ./assets/admin && jade ./views/admin/dash.jade > ./assets/admin/index.html && rm ./views/admin/dash.html
mkdir -p ./assets/admin/event && jade ./views/admin/event.jade > ./assets/admin/event/index.html && rm ./views/admin/event.html
mkdir -p ./assets/admin/tickets && jade ./views/admin/tickets.jade > ./assets/admin/tickets/index.html && rm ./views/admin/tickets.html
mkdir -p ./assets/admin/transactions && jade ./views/admin/transactions.jade > ./assets/admin/transactions/index.html && rm ./views/admin/transactions.html
mkdir -p ./assets/admin/users && jade ./views/admin/users.jade > ./assets/admin/users/index.html && rm ./views/admin/users.html
