import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
    try {
        let token;

        // 1. Check token from cookies
        if (req.cookies?.token) {
            token = req.cookies.token;
        }

        // 2. Check token from Authorization header (Bearer token)
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        // 3. If no token found
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access, token missing",
                success: false
            });
        }

        // 4. Verify token
        const decoded = jwt.verify(token, process.env.secretKey);

        // 5. Attach user to request
        req.userId = decoded.userId;

        next();

    } catch (error) {
        console.log("Error in authentication middleware: ", error);

        return res.status(401).json({
            message: "Invalid or expired token",
            success: false
        });
    }
};

export { isAuthenticated };