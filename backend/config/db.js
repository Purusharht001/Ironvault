const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Ye code aapki .env file se MONGO_URI link uthayega
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Agar connect nahi hua toh server rok dega
    }
};

module.exports = connectDB;