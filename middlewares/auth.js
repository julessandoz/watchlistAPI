import jwt from "jsonwebtoken";
import * as config from "../config.js";
const secretKey = config.jwtSecret;

export function authenticate(req, res, next){
    const authorization = req.get("Authorization");
    if (!authorization) {
        return res.status(401).send("Authorization header is missing");
    }
    const match = authorization.match(/^Bearer (.+)$/);
    if (!match) {
        return res.status(401).send("Authorization header is invalid");
    }

    const token = match[1];
    jwt.verify(token, secretKey, (err, payload) => {
        if (err) {
            return res.status(401).send("Invalid token");
        }
        req.userId = payload.userId;
        req.username = payload.username;
        next();
    });
}