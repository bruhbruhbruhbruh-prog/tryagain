const express = require('express');
const fetch = require('node-fetch');

const app = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// API endpoint for fetching Roblox user data
app.get('/api/getUserId', async (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        // First, get the user ID from the profile URL
        const profileResponse = await fetch(`https://www.roblox.com/users/profile?username=${encodeURIComponent(username)}`);
        if (!profileResponse.ok) {
            return res.status(404).json({ error: 'User not found' });
        }
        const url = profileResponse.url;
        const userId = url.match(/\d+/)[0];

        // Then, get the thumbnail from Roblox API
        const thumbnailResponse = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        if (!thumbnailResponse.ok) {
            throw new Error('Failed to fetch user thumbnail');
        }
        const thumbnailData = await thumbnailResponse.json();
        
        if (thumbnailData.data && thumbnailData.data.length > 0) {
            const imageUrl = thumbnailData.data[0].imageUrl;
            return res.json({ 
                success: true,
                userId, 
                imageUrl 
            });
        } else {
            throw new Error('No thumbnail data found');
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch user data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { message: err.message })
    });
});

// Export the Express app
module.exports = app;
