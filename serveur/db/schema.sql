-- =========================
-- USERS
-- =========================
CREATE DATABASE IF NOT EXISTS xml_projet;
USE xml_projet;
-- =========================
-- USERS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(80),
  last_name VARCHAR(80),
  role ENUM('USER','ADMIN','SUPER_ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- CINEMAS
-- =========================
CREATE TABLE IF NOT EXISTS cinemas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(120) NOT NULL,
  address VARCHAR(255) NOT NULL
);

-- =========================
-- ADMIN ↔ CINEMA
-- =========================
CREATE TABLE IF NOT EXISTS admin_cinemas (
  user_id INT NOT NULL,
  cinema_id INT NOT NULL,
  PRIMARY KEY (user_id, cinema_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

-- =========================
-- MOVIES
-- =========================
CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  year SMALLINT,
  duration_min SMALLINT,
  min_age SMALLINT,
  language VARCHAR(10),
  subtitles VARCHAR(10),
  director VARCHAR(255),
  actors_text TEXT,
  poster_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================
-- SCREENINGS (SEANCES)
-- =========================
CREATE TABLE IF NOT EXISTS screenings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT NOT NULL,
  cinema_id INT NOT NULL,
  start_at DATETIME NOT NULL,
  price_eur DECIMAL(6,2),
  room VARCHAR(50),
  format VARCHAR(30),
  FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
  FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE
);

CREATE INDEX idx_cinemas_city ON cinemas(city);
CREATE INDEX idx_screenings_movie ON screenings(movie_id);
CREATE INDEX idx_screenings_cinema ON screenings(cinema_id);
CREATE INDEX idx_screenings_date ON screenings(start_at);


-- =========================
-- DEMANDES : USER -> ADMIN (propriétaire)
-- =========================
CREATE TABLE IF NOT EXISTS admin_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP NULL,
  decided_by INT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE movies ADD COLUMN created_by INT NULL;

ALTER TABLE movies
  ADD CONSTRAINT fk_movies_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
-- =========================
-- MOVIES : auteur de création (pour limiter la suppression aux films créés par le propriétaire)
-- =========================
ALTER TABLE movies ADD COLUMN created_by INT NULL;
ALTER TABLE movies
  ADD CONSTRAINT fk_movies_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  
  
  SELECT id, email, role FROM users;
  
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE email = 'admin@gmail.com';


-- =========================
-- SEED: CINEMAS
-- =========================
INSERT INTO cinemas (name, city, address) VALUES
('UGC Les Halles', 'Paris', '7 Place de la Rotonde, 75001 Paris'),
('Pathé Beaugrenelle', 'Paris', '7 Rue Linois, 75015 Paris'),
('UGC Ciné Cité La Défense', 'Puteaux', '2 Parvis de la Défense, 92800 Puteaux'),
('Pathé Belle Épine', 'Thiais', 'Centre Commercial Belle Epine, 94320 Thiais')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =========================
-- SEED: MOVIES
-- created_by = NULL (créés par seed, pas par un propriétaire)
-- =========================
INSERT INTO movies (title, duration_min, min_age, language, subtitles, director, actors_text, poster_url, created_by) VALUES
('Inception', 148, 12, 'EN', 'FR', 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page', NULL, NULL),
('Interstellar', 169, 10, 'EN', 'FR', 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', NULL, NULL),
('Parasite', 132, 12, 'KO', 'FR', 'Bong Joon-ho', 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong', NULL, NULL),
('Le Voyage de Chihiro', 125, 0, 'JA', 'FR', 'Hayao Miyazaki', 'Rumi Hiiragi, Miyu Irino', NULL, NULL),
('Dune', 155, 12, 'EN', 'FR', 'Denis Villeneuve', 'Timothée Chalamet, Rebecca Ferguson, Oscar Isaac', NULL, NULL),
('The Dark Knight', 152, 12, 'EN', 'FR', 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart', NULL, NULL),
('Your Name', 106, 0, 'JA', 'FR', 'Makoto Shinkai', 'Ryunosuke Kamiki, Mone Kamishiraishi', NULL, NULL),
('La La Land', 128, 10, 'EN', 'FR', 'Damien Chazelle', 'Ryan Gosling, Emma Stone, John Legend', NULL, NULL),
('Joker', 122, 16, 'EN', 'FR', 'Todd Phillips', 'Joaquin Phoenix, Robert De Niro, Zazie Beetz', NULL, NULL),
('Avengers: Endgame', 181, 10, 'EN', 'FR', 'Anthony & Joe Russo', 'Robert Downey Jr., Chris Evans, Scarlett Johansson', NULL, NULL);

-- =========================
-- SEED: SCREENINGS
-- On récupère les IDs via SELECT
-- =========================

-- Helper: récupérer les IDs (optionnel)
-- SELECT id, name, city FROM cinemas;
-- SELECT id, title FROM movies;

-- Paris - UGC Les Halles
INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-25 18:00:00', 12.90, 'Salle 1', '2D'
FROM movies m, cinemas c
WHERE m.title='Inception' AND c.name='UGC Les Halles' AND c.city='Paris';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-25 20:45:00', 12.90, 'Salle 1', '2D'
FROM movies m, cinemas c
WHERE m.title='Interstellar' AND c.name='UGC Les Halles' AND c.city='Paris';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-26 19:30:00', 11.90, 'Salle 3', 'VOST'
FROM movies m, cinemas c
WHERE m.title='Parasite' AND c.name='UGC Les Halles' AND c.city='Paris';

-- Paris - Pathé Beaugrenelle
INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-25 17:15:00', 13.50, 'Salle 5', 'IMAX'
FROM movies m, cinemas c
WHERE m.title='Dune' AND c.name='Pathé Beaugrenelle' AND c.city='Paris';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-26 21:00:00', 13.50, 'Salle 2', '2D'
FROM movies m, cinemas c
WHERE m.title='The Dark Knight' AND c.name='Pathé Beaugrenelle' AND c.city='Paris';

-- Puteaux - UGC La Défense
INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-25 16:30:00', 12.00, 'Salle 7', '2D'
FROM movies m, cinemas c
WHERE m.title='Avengers: Endgame' AND c.name='UGC Ciné Cité La Défense' AND c.city='Puteaux';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-26 18:30:00', 11.50, 'Salle 4', 'VOST'
FROM movies m, cinemas c
WHERE m.title='Your Name' AND c.name='UGC Ciné Cité La Défense' AND c.city='Puteaux';

-- Thiais - Pathé Belle Épine
INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-25 15:00:00', 10.90, 'Salle 2', '2D'
FROM movies m, cinemas c
WHERE m.title='Le Voyage de Chihiro' AND c.name='Pathé Belle Épine' AND c.city='Thiais';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-26 20:00:00', 10.90, 'Salle 6', '2D'
FROM movies m, cinemas c
WHERE m.title='La La Land' AND c.name='Pathé Belle Épine' AND c.city='Thiais';

INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
SELECT m.id, c.id, '2026-01-26 22:15:00', 10.90, 'Salle 6', '2D'
FROM movies m, cinemas c
WHERE m.title='Joker' AND c.name='Pathé Belle Épine' AND c.city='Thiais';

SELECT id, title, poster_url
FROM movies
ORDER BY id DESC
LIMIT 10;

SELECT id, name, city, CONCAT('[', city, ']') AS city_debug
FROM cinemas
ORDER BY city, name;