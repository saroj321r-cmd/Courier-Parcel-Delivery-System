/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            req.session.errorMessage = 'Authentication required.';
            return res.redirect('/login');
        }

        const userRole = req.session.user.role;
        if (!allowedRoles.includes(userRole)) {
            // Log unauthorized attempt and render error or redirect to home dashboard
            const err = new Error('You do not have authorization to view this resource.');
            err.status = 403;
            return next(err);
        }

        next();
    };
};

module.exports = {
    requireRole
};
