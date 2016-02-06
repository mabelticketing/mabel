echo Enter your MySQL username:
read USER;
echo Enter your MySQL password:
read -s PASS;
echo Enter the desired MySQL database:;
read DBNAME;

mysql -u $USER -p$PASS --execute="CREATE DATABASE IF NOT EXISTS $DBNAME;"
mysql -u $USER -p$PASS $DBNAME < sql/schema.sql;
mysql -u $USER -p$PASS $DBNAME < sql/views.sql;
mysql -u $USER -p$PASS $DBNAME < sql/defaults.sql;
