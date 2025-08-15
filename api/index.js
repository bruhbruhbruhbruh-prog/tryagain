const app = require('../index');

// For Vercel serverless functions
module.exports = (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Pass request to Express app
  return app(req, res);
};
