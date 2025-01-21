import jwt from 'jsonwebtoken';

async function generateToken(user) {
    try {
        if (!process.env.JWT_SECRET_TOKEN) {
            throw new Error('JWT_SECRET_TOKEN is not defined in environment variables');
        }

       
        console.log('Generating token for user:', {
            userId: user._id,
            role: user.role
        });

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET_TOKEN,
            {
                expiresIn: process.env.JWT_SECRET_TOKEN_EXPIRY || '24h' 
            }
        );

        console.log('Token generated successfully');
        return token;
    } catch (error) {
        console.error('Token generation error:', error);
        throw new Error('Failed to generate token');
    }
}

async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const decoded = await jwt.verify(token, process.env.JWT_SECRET_TOKEN);

      
        const timeUntilExpiry = decoded.exp - (Date.now() / 1000);
        const WARNING_THRESHOLD = 60 * 60; 

        if (timeUntilExpiry < WARNING_THRESHOLD) {
            req.tokenAboutToExpire = true;
        }

        
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token' });
        }

        return res.status(401).json({ message: 'Token verification failed' });
    }
}

async function refreshToken(user) {
    try {
        if (!process.env.JWT_REFRESH_TOKEN) {
            throw new Error('JWT_REFRESH_TOKEN is not defined in environment variables');
        }

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_TOKEN,
            { 
                expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d' 
            }
        );
        return refreshToken;
    } catch (error) {
        console.error('Refresh token generation error:', error);
        throw new Error('Failed to generate refresh token');
    }
}

export {
    generateToken,
    verifyToken,
    refreshToken
};