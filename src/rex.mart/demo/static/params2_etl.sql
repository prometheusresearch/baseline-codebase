insert into foo (col1) values (CONCAT(%(prefix)s, %(DEFINITION)s));
insert into foo (col1) values (CONCAT(%(prefix)s, %(foo)s));
insert into foo (col1) values (CONCAT(%(prefix)s, %(bar)s));
