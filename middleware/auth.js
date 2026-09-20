/**
 * Authentication Middleware
 */

// Ensure the user is logged in
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    req.session.errorMessage = 'Please log in to access this page.';
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
};

// Prevent logged in users from visiting login/register pages
const guestOnly = (req, res, next) => {
    if (req.session && req.session.user) {
        const role = req.session.user.role;
        if (role === 'ADMIN') return res.redirect('/admin/dashboard');
        if (role === 'AGENT') return res.redirect('/agent/dashboard');
        return res.redirect('/customer/dashboard');
    }
    next();
};

module.exports = {
    requireAuth,
    guestOnly
};
