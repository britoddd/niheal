-- ========================================
-- SETUP DATABASE
-- ========================================
/*
Go to ../s2c in cmd
Run the following:

psql -U postgres -d postgres
(password sesuai yg dibuat pas install psql)

CREATE USER amdg WITH PASSWORD '12345' CREATEDB;
CREATE DATABASE niheal OWNER amdg;
\q

psql -U amdg -d niheal
(password: 12345)

Lastly, run this file
\i 'dbSetup.sql'
*/

-- ========================================
-- TABLE CREATION
-- ========================================

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
    UNIQUE (sex, variable)
);

CREATE TABLE IF NOT EXISTS cancer_coefficients (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    cancer_type VARCHAR(100) NOT NULL,
    variable VARCHAR(50) NOT NULL,
    beta_value NUMERIC(10,6) NOT NULL,
    base_incidence NUMERIC(10,6) NOT NULL,
    UNIQUE (cancer_type, variable)
);

-- ========================================
-- INSERT DEFAULT DATA SAFELY
-- ========================================

INSERT INTO risk_tests (id, name, description)
SELECT id, name, description FROM (VALUES
    (1, 'Heart and Stroke', 'ASCVD/Atherosclerotic Cardiovascular Disease Risk Assessment (10-year risk)'),
    (2, 'Cancer', 'Cancer Risk Assessment'),
    (3, 'Urology/Kidney', 'Kidney Failure Risk Equation - Predicts 2-year and 5-year risk of end-stage kidney disease')
) AS v(id, name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM risk_tests r WHERE r.id = v.id OR r.name = v.name
);

-- Insert ASCVD coefficients only if table is empty
INSERT INTO ascvd_coefficients (sex, variable, beta_value, mean_value, base_survival_10yr)
SELECT * FROM (
    VALUES
        ('female', 'age_scaled', 0.732, 0.0, 0.9533),
        ('female', 'sbp_low_decrease', 0.113, 0.2, 0.9533),
        ('female', 'sbp_high', 0.165, 1.4, 0.9533),
        ('female', 'treated_sbp_high', 0.068, 0.35, 0.9533),
        ('female', 'smoker', 0.541, 0.15, 0.9533),
        ('female', 'diabetic', 0.947, 0.12, 0.9533),
        ('female', 'non_hdl', 0.237, 3.4, 0.9533),
        ('female', 'hdl_scaled', -0.177, 4.74, 0.9533),
        ('female', 'egfr_low_decrease', 0.175, 0.1, 0.9533),
        ('female', 'egfr_high_decrease', 0.071, -1.67, 0.9533),
        ('female', 'statin', -0.073, 0.18, 0.9533),
        ('female', 'age_non_hdl', -0.036, 0.0, 0.9533),
        ('female', 'age_hdl', 0.030, 0.0, 0.9533),
        ('female', 'age_sbp_high', -0.015, 0.0, 0.9533),
        ('female', 'age_treated_sbp_high', -0.010, 0.0, 0.9533),
        ('female', 'age_smoker', -0.098, 0.0, 0.9533),
        ('female', 'age_diabetic', -0.130, 0.0, 0.9533),
        ('female', 'age_egfr_low', -0.023, 0.0, 0.9533),
        ('female', 'bmi', 0.000, 27.0, 0.9533),

        ('male', 'age_scaled', 0.804, 0.0, 0.9123),
        ('male', 'sbp_low_decrease', 0.100, 0.2, 0.9123),
        ('male', 'sbp_high', 0.180, 1.4, 0.9123),
        ('male', 'treated_sbp_high', 0.050, 0.35, 0.9123),
        ('male', 'smoker', 0.600, 0.22, 0.9123),
        ('male', 'diabetic', 0.800, 0.14, 0.9123),
        ('male', 'non_hdl', 0.250, 3.6, 0.9123),
        ('male', 'hdl_scaled', -0.200, 4.2, 0.9123),
        ('male', 'egfr_low_decrease', 0.200, 0.1, 0.9123),
        ('male', 'egfr_high_decrease', 0.080, -1.67, 0.9123),
        ('male', 'statin', -0.073, 0.15, 0.9123),
        ('male', 'age_non_hdl', -0.040, 0.0, 0.9123),
        ('male', 'age_hdl', 0.035, 0.0, 0.9123),
        ('male', 'age_sbp_high', -0.020, 0.0, 0.9123),
        ('male', 'age_treated_sbp_high', -0.015, 0.0, 0.9123),
        ('male', 'age_smoker', -0.110, 0.0, 0.9123),
        ('male', 'age_diabetic', -0.140, 0.0, 0.9123),
        ('male', 'age_egfr_low', -0.030, 0.0, 0.9123),
        ('male', 'bmi', 0.000, 27.0, 0.9123)
) AS v(sex, variable, beta_value, mean_value, base_survival_10yr)
WHERE NOT EXISTS (SELECT 1 FROM ascvd_coefficients);

INSERT INTO cancer_coefficients (cancer_type, variable, beta_value, base_incidence)
SELECT * FROM (
    VALUES
        -- Lung Cancer Coefficients
        ('lung', 'age', 0.065, 0.0012),
        ('lung', 'smoking_years', 0.042, 0.0012),
        ('lung', 'cigarettes_per_day', 0.038, 0.0012),
        ('lung', 'years_since_quit', -0.035, 0.0012),
        ('lung', 'asbestos_exposure', 0.210, 0.0012),
        ('lung', 'family_history', 0.180, 0.0012),
        ('lung', 'copd', 0.250, 0.0012),
        
        -- Breast Cancer Coefficients (for women)
        ('breast', 'age', 0.055, 0.0085),
        ('breast', 'bmi', 0.015, 0.0085),
        ('breast', 'age_first_birth', -0.020, 0.0085),
        ('breast', 'menarche_age', -0.025, 0.0085),
        ('breast', 'menopausal_status', 0.180, 0.0085),
        ('breast', 'hormone_therapy', 0.120, 0.0085),
        ('breast', 'family_history', 0.450, 0.0085),
        ('breast', 'alcohol_consumption', 0.080, 0.0085),
        
        -- Colon Cancer Coefficients
        ('colon', 'age', 0.060, 0.0040),
        ('colon', 'bmi', 0.025, 0.0040),
        ('colon', 'physical_activity', -0.030, 0.0040),
        ('colon', 'red_meat_consumption', 0.090, 0.0040),
        ('colon', 'vegetable_consumption', -0.035, 0.0040),
        ('colon', 'family_history', 0.380, 0.0040),
        ('colon', 'smoking', 0.150, 0.0040),
        ('colon', 'alcohol_consumption', 0.070, 0.0040),
        
        -- Prostate Cancer Coefficients (for men)
        ('prostate', 'age', 0.085, 0.0120),
        ('prostate', 'family_history', 0.520, 0.0120),
        ('prostate', 'bmi', 0.018, 0.0120),
        ('prostate', 'smoking', 0.120, 0.0120),
        ('prostate', 'diet_fat', 0.095, 0.0120)
) AS v(cancer_type, variable, beta_value, base_incidence)
WHERE NOT EXISTS (SELECT 1 FROM cancer_coefficients);