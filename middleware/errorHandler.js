/**
 * Centralized Error Handlers
 */

// 404 Not Found Handler
const notFoundHandler = (req, res, next) => {
    res.status(404).render('404', {
        title: 'Page Not Found | CourierX',
        path: req.originalUrl
    });
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred. Please try again later.';

    res.status(statusCode).render('error', {
        title: `${statusCode} Error | CourierX`,
        statusCode,
        message,
        path: req.originalUrl
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};
