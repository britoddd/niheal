-- SETUP DATABASE

/*
1. go to ../s2c in cmd
2. run the following:

psql -U postgres -d postgres
(password sesuai yg dibuat pas install psql)

CREATE USER amdg WITH PASSWORD '12345' CREATEDB;
CREATE DATABASE niheal OWNER amdg;
\q

psql -U amdg -d niheal
(password: 12345)


3. last, run this file
\i 'dbSetup.sql' 

*/

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    UNIQUE (email)
);

CREATE TABLE profiles (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    birthdate DATE,
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    profile_picture TEXT
);