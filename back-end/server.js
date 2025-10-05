const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require("passport");
const initializePassport = require("./passportConfig");
const cors = require('cors');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ASCVDCalculator = require("./ascvd_calc");

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

initializePassport(passport);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, req.user.id + "_profile" + ext);
    }
});

const upload = multer({ storage });
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: `secret`,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
    }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.get("/api/", (req, res) => {
    res.json({ message: "Backend API is running!" });
});

app.get("/api/user", checkNotAuthenticated, (req, res) => {
    res.json({ user: req.user });
});

app.post("/api/logout", (req, res, next) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.json({ message: "You have logged out." });
    });
});

app.post("/api/register", async (req, res) => {
    let { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields!" });
    }
    if (password.length < 8) {
        errors.push({ message: "Password should be at least 8 characters long." });
    }
    if (password != password2) {
        errors.push({ message: "Passwords do not match." });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        let hashedPassword = await bcrypt.hash(password, 10);
        pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: "Database error!" });
                }
                if (results.rows.length > 0) {
                    return res.status(400).json({
                        errors: [{ message: "Email already registered. Please login." }]
                    });
                } else {
                    pool.query(
                        `INSERT INTO users (name, email, password)
                         VALUES ($1, $2, $3)
                         RETURNING id, name, email`,
                        [name, email, hashedPassword],
                        (err, results) => {
                            if (err) {
                                return res.status(500).json({ message: "Database error!" });
                            }
                            res.json({
                                message: "You are now registered. Please login.",
                                user: results.rows[0]
                            });
                        }
                    );
                }
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) {
            return res.status(500).json({ message: "Server error!" });
        }
        if (!user) {
            return res.status(401).json({ message: info.message });
        }
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({ message: "Login error!" });
            }
            return res.json({
                message: "Login successful!",
                user: { id: user.id, name: user.name, email: user.email }
            });
        });
    })(req, res, next);
});

// Get logged in user's profile
app.get("/api/profile", checkNotAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, p.birthdate, p.weight, p.height, p.profile_picture
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );

    const profile = result.rows[0];
    if (profile && profile.birthdate) {
    // convert to YYYY-MM-DD manually using UTC values
    const d = new Date(profile.birthdate);
    profile.birthdate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
        .toISOString()
        .split('T')[0];
    }

    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching profile." });
  }
});

// Create or update profile
app.put("/api/profile", checkNotAuthenticated, async (req, res) => {
    const { birthdate, weight, height, profile_picture } = req.body;
    try {
        await pool.query(
            `INSERT INTO profiles (user_id, birthdate, weight, height, profile_picture)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id)
             DO UPDATE SET birthdate = $2, weight = $3, height = $4, profile_picture = $5`,
            [req.user.id, birthdate, weight, height, profile_picture]
        );
        res.json({ message: "Profile saved successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error saving profile." });
    }
});

// Upload profile picture
app.post("/api/profile/picture", checkNotAuthenticated, upload.single("picture"), async (req, res) => {
    try {
        const filePath = `/uploads/${req.file.filename}`;
        await pool.query(
            `INSERT INTO profiles (user_id, profile_picture)
             VALUES ($1, $2)
             ON CONFLICT (user_id)
             DO UPDATE SET profile_picture = $2`,
            [req.user.id, filePath]
        );
        res.json({ message: "Profile picture uploaded!", profile_picture: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error uploading profile picture." });
    }
});

// Get available risk tests
app.get("/api/risk-tests", checkNotAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, description FROM risk_tests WHERE is_active = true`
        );
        res.json({ tests: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching risk tests." });
    }
});

// Calculate ASCVD risk
app.post("/api/calculate-ascvd", checkNotAuthenticated, async (req, res) => {
    let {
        age, sex, systolic_bp, total_chol, hdl_chol,
        is_smoker, is_diabetic, is_treated_bp, is_treated_chol, egfr
    } = req.body;

    console.log('Received ASCVD calculation request:', req.body);

    const errors = [];
    if (!age || age < 18 || age > 100) errors.push("Age must be between 18-100 years");
    if (!sex || !['male', 'female'].includes(sex)) errors.push("Sex must be male or female");
    if (!systolic_bp || systolic_bp < 80 || systolic_bp > 250) errors.push("Systolic BP must be between 80-250 mmHg");
    if (!total_chol || total_chol < 100 || total_chol > 400) errors.push("Total cholesterol must be between 100-400 mg/dL");
    if (!hdl_chol || hdl_chol < 20 || hdl_chol > 100) errors.push("HDL cholesterol must be between 20-100 mg/dL");
    if (!egfr || egfr < 15 || egfr > 120) errors.push("eGFR must be between 15-120 mL/min/1.73m²");

    if (errors.length > 0) {
        console.log('Validation errors:', errors);
        return res.status(400).json({ errors });
    }

    try {
        const profileResult = await pool.query(
            `SELECT weight, height FROM profiles WHERE user_id = $1`,
            [req.user.id]
        );

        let bmi = null;
        if (profileResult.rows.length > 0) {
            const { weight, height } = profileResult.rows[0];
            if (weight && height && height > 0) {
                bmi = weight / Math.pow(height / 100, 2);
            }
        }
        if (!bmi) bmi = 27.0; // default

        const inputs = {
            age, sex, systolic_bp, total_chol, hdl_chol,
            is_smoker, is_diabetic, is_treated_bp, is_treated_chol, egfr, bmi
        };

        const coefficientsResult = await pool.query(
            `SELECT variable, beta_value, mean_value, base_survival_10yr
             FROM ascvd_coefficients WHERE sex = $1`,
            [sex]
        );

        console.log(`Found ${coefficientsResult.rows.length} coefficients for sex: ${sex}`);
        if (coefficientsResult.rows.length === 0) {
            return res.status(400).json({ message: "No coefficients found for the specified sex." });
        }

        const coefficients = {};
        coefficientsResult.rows.forEach(row => {
            coefficients[row.variable] = {
                beta_value: parseFloat(row.beta_value),
                mean_value: parseFloat(row.mean_value),
                base_survival_10yr: parseFloat(row.base_survival_10yr)
            };
        });

        const riskResult = ASCVDCalculator.calculateRisk(inputs, coefficients);

        const testResult = await pool.query(
            `INSERT INTO test_results
             (user_id, test_id, risk_percentage, risk_category, input_data, calculated_data)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [
                req.user.id,
                1, // ASCVD test ID
                riskResult.risk_percentage,
                riskResult.risk_category,
                inputs,
                riskResult
            ]
        );

        res.json({
            ...riskResult,
            result_id: testResult.rows[0].id,
            created_at: testResult.rows[0].created_at,
            interpretation: ASCVDCalculator.getInterpretation(riskResult.risk_category)
        });
    } catch (err) {
        console.error("ASCVD calculation error:", err);
        res.status(500).json({ message: "Error calculating ASCVD risk: " + err.message });
    }
});

// Get user's test history
app.get("/api/test-history", checkNotAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tr.id, tr.risk_percentage, tr.risk_category, tr.created_at,
                    rt.name as test_name, rt.description as test_description
             FROM test_results tr
             JOIN risk_tests rt ON tr.test_id = rt.id
             WHERE tr.user_id = $1
             ORDER BY tr.created_at DESC`,
            [req.user.id]
        );
        res.json({ history: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error fetching test history." });
    }
});

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.status(200).json({ user: req.user });
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Not authenticated." });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});