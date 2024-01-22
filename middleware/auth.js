const jwt = require('jsonwebtoken');
const config = require('config');

// Protected Middleware route for verifying token
module.exports = function(req, res, next) {
    // Get the token from header
    const token = req.header('x-auth-token');

    // Check if there is no token found
    if (!token) {
        return res.status(401).json({msg: 'Not Token, Authorization not found'});
    }

    // Verify Token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        
        req.user = decoded.user;
        next();
    }
    catch(error) {
        res.status(401).json({message: 'Token is not valid'});
    }
}