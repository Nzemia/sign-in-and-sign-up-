import express from "express";
import mongoose from 'mongoose';
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import dotenv from 'dotenv';
dotenv.config();



const app = express();

mongoose.connect(process.env.MONGO)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) =>{
        console.log(err);
});

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "uvugbhjnkmvgbhnjkm6ybhrd7iwn";

app.use(express.json());

app.use(cookieParser())

app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
}))






app.get('/test', (req, res) => {
    res.json('test okay');
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;  
    try {
        const userDoc = await User.create({
        name,
        email,
        password:bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);        
    } catch (e) {
        res.status(422).json(e)
        
    }    
});

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });
    if (userDoc){
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if ( passOk ) {
            jwt.sign({ 
                email:userDoc.email, 
                id:userDoc._id},                
                jwtSecret, {}, (err, token) => {
                if( err )throw err;
                res.cookie("token", token).json(userDoc)
            });
            } else {
            res.status(422).json("pass not okay")
        }
    } else {
        res.json("not found")
    }
});

app.get("/profile", async (req, res) => {
    const { token } = req.cookies;
    if (token) {
        try {
            const userData = jwt.verify(token, jwtSecret);
            const user = await User.findById(userData.id);
            if (user) {
                const { name, email, _id } = user;
                res.json({ name, email, _id });
            } else {
                res.json(null);
            }
        } catch (err) {
            throw err;
        }
    } else {
        res.json(null);
    }
});

app.listen(4000, () => {
    console.log("Server is running on port 4000!");
});