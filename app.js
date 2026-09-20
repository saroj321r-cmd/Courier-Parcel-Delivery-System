const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const agentRoutes = require('./routes/agentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

const app = express();

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Assets
app.use(express.static(path.join(__dirname, 'public')));

// Request Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// Session Setup with MongoDB Store
const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/courierx';
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'courierx_secret_key_college_project_2026',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl,
            ttl: 24 * 60 * 60, // 1 day
            autoRemove: 'native'
        }),
        cookie: {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            secure: process.env.NODE_ENV === 'production'
        }
    })
);

// Global Template Variables & Flash Messages Middleware
app.use((req, res, next) => {
    // Current authenticated user
    res.locals.currentUser = req.session.user || null;

    // Flash Messages
    res.locals.successMessage = req.session.successMessage || null;
    res.locals.errorMessage = req.session.errorMessage || null;
    delete req.session.successMessage;
    delete req.session.errorMessage;

    // Current URL path
    res.locals.currentPath = req.path;

    next();
});

// Mount Routes
app.use('/', trackingRoutes);
app.use('/', authRoutes);
app.use('/customer', customerRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);

// 404 Catch-all
app.use(notFoundHandler);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
