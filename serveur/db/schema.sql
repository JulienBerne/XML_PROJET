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


-- =========================
-- MOVIES : auteur de création (pour limiter la suppression aux films créés par le propriétaire)
-- =========================
ALTER TABLE movies ADD COLUMN created_by INT NULL;
ALTER TABLE movies
  ADD CONSTRAINT fk_movies_created_by
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
