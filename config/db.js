const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/courierx');
        console.log(`[MongoDB] Database connected successfully: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`[MongoDB] Connection error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
