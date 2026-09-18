const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db'); const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 1. Database file ko import karein
const connectDB = require('./config/db');

dotenv.config();

// 2. Database connection function ko call karein
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "IronVault Engine is Live! 🚀"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});

// Environment variables load karna
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: "IronVault Engine is Live! 🚀"
    });
});

// Port aur Server Listen
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
});