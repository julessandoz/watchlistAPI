import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import * as config from "../config";
const secretKey = config.jwtSecret;

const router = express.Router();

/**
 * @api {post} /auth/register Register a new user
 * @apiGroup Auth
 * @apiName Register
 * @apiBody {String{2-10}} username Username
 * @apiBody {String} email Email
 * @apiBody {String{8..}} password Password
 * @apiBody {String{8..}} confirmPassword Confirm password
 * @apiParamExample {json} Request-Example:
 *   {
 *      "username": "test",
 *      "email": "test@example.com",
 *      "password": "Test1234!",
 *      "confirmPassword": "Test1234!"
 *  }
 * @apiSuccess {String} _id User ID
 * @apiSuccess {String} username Username
 * @apiSuccess {String} email Email
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 201 Created
 *   {
 *      "_id": "5f9e1b9b9b9b9b9b9b9b9b9b",
 *      "username": "test",
 *      "email": "test@example.com",
 * }
 * 
 * @apiError (400) UsernameRequired Username is required
 * @apiError (400) UsernameTooShort Username is too short, minimum 2 characters
 * @apiError (400) UsernameTooLong Username is too long, maximum 10 characters
 * @apiError (400) UsernameAlreadyInUse Username is already in use
 * @apiError (400) EmailInvalid Please enter a valid email address
 * @apiError (400) EmailAlreadyInUse Email is already in use
 * @apiError (400) PasswordRequired Password is required
 * @apiError (400) PasswordInvalid Password must contain at least one uppercase letter, one lowercase letter, one number and one special character
 * @apiError (400) PasswordsDoNotMatch Passwords do not match
 * 
 */
router.post("/register", async (req, res, next) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        next(error);
    }
});


/**
 * @api {post} /auth/login Login
 * @apiGroup Auth
 * @apiName Login
 * @apiBody {String} email Email
 * @apiBody {String} password Password
 * @apiParamExample {json} Request-Example:
 *  {
 *      "email": "test@example.com",
 *      "password": "Test1234!" 
 * }
 * @apiSuccess {String} token JWT token
 * @apiSuccess {Object} user User object
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *  {
 *      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZjllMWI5YjliOWI5YjliOWI5YjliOWIiLCJ1c2VybmFtZSI6InRlc3QifQ.x2tpZo3QyoK4-a6yuQoAw6qHgCqdzoeKchEQ3T3vVKM",
 *      "user": {
 *          "_id": "5f9e1b9b9b9b9b9b9b9b9b9b",
 *          "username": "test",
 *          "email": "test@example.com"
 *      }
 *  }
 * @apiError (401) EmailAndPasswordRequired Email and password are required
 * @apiError (401) InvalidEmailOrPassword Invalid email or password
 * 
 * */
router.post("/login", async (req, res, next) => {
    if (!req.email || !req.password) {
        return res.status(401).send("Email and password are required");
    }
    try {
        const user = await User.findOne({ email: req.email });
        if (!user) {
            return res.status(401).send("Invalid email or password");
        }
        const match = bcrypt.compare(req.password, user.password);
        if (!match) {
            return res.status(401).send("Invalid email or password");
        }
        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const payload = { userId: user._id.toString(), username: user.username, exp: exp };
        const token = jwt.sign(payload, secretKey);
        res.send({ token: token, user: user });
    } catch (error) {
        next(error);
    }
    });

export default router;