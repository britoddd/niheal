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

-- Updated Cancer Coefficients based on research papers
INSERT INTO cancer_coefficients (cancer_type, variable, beta_value, base_incidence)
SELECT * FROM (
    VALUES
        -- Prostate Cancer Coefficients (PCPTRC 2.0 model)
        ('prostate', 'age', 0.050, 0.038), -- 3.8% high-grade cancer incidence in PCPT
        ('prostate', 'psa_log2', 0.710, 0.038), -- OR 2.02 for high-grade vs no cancer
        ('prostate', 'dre_abnormal', 0.400, 0.038), -- OR 1.49 for high-grade vs no cancer
        ('prostate', 'african_american', 1.040, 0.038), -- OR 2.83 for high-grade vs no cancer
        ('prostate', 'prior_biopsy', -0.210, 0.038), -- OR 0.81 for high-grade vs no cancer
        ('prostate', 'family_history', 0.223, 0.038), -- OR 1.25 for high-grade vs no cancer
        ('prostate', 'free_psa_percent', -0.025, 0.038), -- Based on SABOR study
        
        -- Lung Cancer Coefficients (PLCOm2012 model)
        ('lung', 'age', 0.085, 0.0151), -- 1.51% 6-year risk threshold
        ('lung', 'smoking_duration', 0.045, 0.0151),
        ('lung', 'cigarettes_per_day', 0.038, 0.0151),
        ('lung', 'quit_time', -0.040, 0.0151),
        ('lung', 'bmi', -0.020, 0.0151),
        ('lung', 'copd', 0.500, 0.0151),
        ('lung', 'family_history_lung', 0.350, 0.0151),
        ('lung', 'personal_cancer_history', 0.280, 0.0151),
        ('lung', 'education', -0.150, 0.0151),
        ('lung', 'asbestos_exposure', 0.420, 0.0151),
        
        -- Breast Cancer Coefficients (Gail model)
        ('breast', 'age', 0.055, 0.014), -- 1.4% 5-year risk in lifepool cohort
        ('breast', 'age_menarche', -0.080, 0.014),
        ('breast', 'age_first_birth', -0.035, 0.014),
        ('breast', 'first_degree_relatives', 0.650, 0.014),
        ('breast', 'breast_biopsies', 0.280, 0.014),
        ('breast', 'atypical_hyperplasia', 0.890, 0.014),
        ('breast', 'bmi', 0.018, 0.014),
        ('breast', 'hormone_therapy', 0.320, 0.014),
        ('breast', 'alcohol_consumption', 0.095, 0.014),
        
        -- Colorectal Cancer Coefficients (CRC-PRO model)
        ('colorectal', 'age', 0.090, 0.016), -- 1.6% 10-year risk in men
        ('colorectal', 'bmi', 0.025, 0.016),
        ('colorectal', 'smoking_pack_years', 0.035, 0.016),
        ('colorectal', 'alcohol_drinks_day', 0.120, 0.016),
        ('colorectal', 'red_meat_oz', 0.085, 0.016),
        ('colorectal', 'family_history_colon', 0.315, 0.016),
        ('colorectal', 'diabetes', 0.233, 0.016),
        ('colorectal', 'physical_activity', -0.090, 0.016),
        ('colorectal', 'aspirin_use', -0.210, 0.016),
        ('colorectal', 'multivitamin_use', -0.192, 0.016),
        ('colorectal', 'education_years', -0.070, 0.016),
        ('colorectal', 'nsaid_use', -0.237, 0.016),
        ('colorectal', 'estrogen_use', -0.245, 0.010) -- 1.0% 10-year risk in women
) AS v(cancer_type, variable, beta_value, base_incidence)
WHERE NOT EXISTS (SELECT 1 FROM cancer_coefficients);