mkdir -p ./public && jade ./views/index.jade > ./public/index.html && rm ./views/index.html
mkdir -p ./public/dash && jade ./views/dash.jade > ./public/dash/index.html && rm ./views/dash.html
mkdir -p ./public/book && jade ./views/book.jade > ./public/book/index.html && rm ./views/book.html
mkdir -p ./public/admin && jade ./views/admin/dash.jade > ./public/admin/index.html && rm ./views/admin/dash.html
mkdir -p ./public/admin/event && jade ./views/admin/event.jade > ./public/admin/event/index.html && rm ./views/admin/event.html
mkdir -p ./public/admin/tickets && jade ./views/admin/tickets.jade > ./public/admin/tickets/index.html && rm ./views/admin/tickets.html
mkdir -p ./public/admin/transactions && jade ./views/admin/transactions.jade > ./public/admin/transactions/index.html && rm ./views/admin/transactions.html
mkdir -p ./public/admin/users && jade ./views/admin/users.jade > ./public/admin/users/index.html && rm ./views/admin/users.html
