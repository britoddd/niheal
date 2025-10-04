const express = require('express');
const app = express();
const {pool} = require("./dbConfig");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require("passport");
const initializePassport = require("./passportConfig");
const cors = require('cors');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
        cb(null, req.user.id + "_profile" + ext); // e.g. 5_profile.jpg
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
app.use(express.urlencoded({extended: false}));

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

app.use(flash())

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.get("/api/", (req, res) => {
    res.json({ message: "Backend API is running!" });
});

app.get("/api/user", checkNotAuthenticated, (req, res) => {
    res.json({ user: req.user });
});

app.post("/api/logout", (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.json({ message: "You have logged out." });
    });
});

app.post("/api/register", async (req, res) => {
    let {name, email, password, password2} = req.body;
    let errors = [];

    if(!name || !email || !password || !password2) {
        errors.push({message: "Please enter all fields!"});
    }

    if(password.length < 8) {
        errors.push({message: "Password should be at least 8 characters long."});
    }

    if(password != password2) {
        errors.push({message: "Passwords do not match."});
    }

    if(errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        let hashedPassword = await bcrypt.hash(password, 10);

        pool.query(
            `SELECT * FROM users WHERE email = $1`,
            [email],
            (err, results) => {
                if(err) {
                    return res.status(500).json({ message: "Database error!" });
                }
                if(results.rows.length > 0) {
                    return res.status(400).json({ 
                        errors: [{message: "Email already registered. Please login."}]
                    });
                } else {
                    pool.query(
                        `INSERT INTO users (name, email, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, name, email`,
                        [name, email, hashedPassword],
                        (err, results) => {
                            if(err) {
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
        res.json({ profile: result.rows[0] });
    } catch (err) {
        res.status(500).json({ message: "Error fetching profile." });
    }
});

// Create or update profile (text fields)
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

// Upload profile picture (file)
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

function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return res.status(200).json({ user: req.user });
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: "Not authenticated." });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});