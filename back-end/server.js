const express = require('express');
const app = express();
const {pool} = require("./dbConfig");
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('express-flash');
const passport = require("passport");
const initializePassport = require("./passportConfig");
const cors = require('cors');

initializePassport(passport);

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
    save: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash())

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