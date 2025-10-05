-- SETUP DATABASE

/*
1. Go to ../s2c in cmd
2. Run the following:

psql -U postgres -d postgres
(password sesuai yg dibuat pas install psql)

CREATE USER amdg WITH PASSWORD '12345' CREATEDB;
CREATE DATABASE niheal OWNER amdg;
\q

psql -U amdg -d niheal
(password: 12345)

3. Lastly, run this file
\i 'dbSetup.sql'
*/

-- ==============================
-- TABLE CREATION
-- ==============================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    password VARCHAR(200) NOT NULL,
    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS profiles (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    birthdate DATE,
    weight NUMERIC(5,2),
    height NUMERIC(5,2),
    profile_picture TEXT
);

CREATE TABLE IF NOT EXISTS risk_tests (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_results (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    test_id BIGINT REFERENCES risk_tests(id) ON DELETE CASCADE NOT NULL,
    risk_percentage NUMERIC(5,2) NOT NULL,
    risk_category VARCHAR(50) NOT NULL,
    input_data JSONB NOT NULL,
    calculated_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ascvd_coefficients (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    sex VARCHAR(10) NOT NULL,
    variable VARCHAR(50) NOT NULL,
    beta_value NUMERIC(10,6) NOT NULL,
    mean_value NUMERIC(10,6) NOT NULL,
    base_survival_10yr NUMERIC(10,6) NOT NULL,
    UNIQUE (sex, variable) -- prevents duplicate coefficients
);

-- ==============================
-- INSERT DEFAULT DATA SAFELY
-- ==============================

INSERT INTO risk_tests (id, name, description)
SELECT id, name, description FROM (VALUES
    (1, 'ASCVD', 'Atherosclerotic Cardiovascular Disease Risk Assessment (10-year risk)'),
    (2, 'Cancer', 'Cancer Risk Assessment'),
    (3, 'Stroke', 'Stroke Risk Assessment'),
    (4, 'Urology', 'Urological Diseases Risk Assessment')
) AS v(id, name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM risk_tests r WHERE r.id = v.id OR r.name = v.name
);

-- Insert ASCVD coefficients only if table is empty
INSERT INTO ascvd_coefficients (sex, variable, beta_value, mean_value, base_survival_10yr)
SELECT * FROM (
    VALUES
    ('female', 'age_sqrt', 0.315, 6.123, 0.989),
    ('female', 'log_sbp', 0.428, 4.852, 0.989),
    ('female', 'total_chol', 0.002, 199.5, 0.989),
    ('female', 'hdl_chol', -0.015, 55.2, 0.989),
    ('female', 'smoker', 0.645, 0.15, 0.989),
    ('female', 'diabetic', 0.422, 0.12, 0.989),
    ('female', 'bp_treated', 0.235, 0.25, 0.989),
    ('female', 'chol_treated', 0.128, 0.18, 0.989),
    ('female', 'log_egfr', -0.215, 4.18, 0.989),

    ('male', 'age_sqrt', 0.385, 6.245, 0.985),
    ('male', 'log_sbp', 0.452, 4.867, 0.985),
    ('male', 'total_chol', 0.003, 195.8, 0.985),
    ('male', 'hdl_chol', -0.018, 48.5, 0.985),
    ('male', 'smoker', 0.712, 0.22, 0.985),
    ('male', 'diabetic', 0.385, 0.14, 0.985),
    ('male', 'bp_treated', 0.198, 0.20, 0.985),
    ('male', 'chol_treated', 0.145, 0.15, 0.985),
    ('male', 'log_egfr', -0.198, 4.15, 0.985)
) AS v(sex, variable, beta_value, mean_value, base_survival_10yr)
WHERE NOT EXISTS (SELECT 1 FROM ascvd_coefficients);