require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const INITIAL_PORT = parseInt(process.env.PORT, 10) || 5001;

/**
 * Start the CourierX Server with Automatic Port Conflict Resolution
 */
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        const tryListen = (port) => {
            const server = app.listen(port, () => {
                console.log('====================================================');
                console.log(`🚀 COURIERX Delivery Tracking System is Running!`);
                console.log(`📍 Web Application: http://localhost:${port}`);
                console.log(`📍 Local IP URL:    http://127.0.0.1:${port}`);
                console.log(`🌍 Environment:     ${process.env.NODE_ENV || 'development'}`);
                console.log('====================================================');
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.warn(`\n[CourierX] ⚠️  Port ${port} is in use (often macOS AirPlay Receiver on port 5000).`);
                    console.warn(`[CourierX] 🔄 Automatically switching to fallback port ${port + 1}...\n`);
                    tryListen(port + 1);
                } else {
                    console.error('Server startup error:', err);
                    process.exit(1);
                }
            });

            // Graceful shutdown
            const handleShutdown = () => {
                console.log('\n[CourierX] Gracefully shutting down HTTP server...');
                server.close(() => {
                    console.log('[CourierX] Server stopped.');
                    process.exit(0);
                });
            };

            process.on('SIGINT', handleShutdown);
            process.on('SIGTERM', handleShutdown);
        };

        tryListen(INITIAL_PORT);

    } catch (error) {
        console.error('CRITICAL: Server initialization failure:', error);
        process.exit(1);
    }
};

startServer();
