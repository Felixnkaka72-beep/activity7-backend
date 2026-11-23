-- Creates the tables. Safe to run more than once.
CREATE TABLE IF NOT EXISTS records (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(80)  NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  category    VARCHAR(40)  NOT NULL CHECK (char_length(category) BETWEEN 2 AND 40),
  description VARCHAR(300) NOT NULL CHECK (char_length(description) BETWEEN 5 AND 300),
  status      VARCHAR(20)  NOT NULL CHECK (status IN ('Pending', 'In progress', 'Completed'))
);

-- Remembers that the starting records were added, so they are never added twice.
CREATE TABLE IF NOT EXISTS seed_status (
  name VARCHAR(40) PRIMARY KEY
);
