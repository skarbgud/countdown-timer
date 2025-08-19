-- This script should be run as SYSTEM user to create the user and grant permissions

-- Create user
CREATE USER countdown IDENTIFIED BY countdown;

-- Grant permissions
GRANT CONNECT, RESOURCE TO countdown;
GRANT CREATE SESSION TO countdown;
GRANT CREATE TABLE TO countdown;
GRANT CREATE SEQUENCE TO countdown;
GRANT UNLIMITED TABLESPACE TO countdown;
