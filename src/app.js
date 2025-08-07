import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    })

)

app.use(express.json({limit: "16kb}"}));
app.use(express.urlencoded({ extended: true }));  //space -> %20 ya url me + use ho jata hi to wo sb ko handle krne ke liye hi
app.use(express.static("public")); //image ya favicon ye sb rkhne ke liye public directory
app.use(cookieParser()); //serve se browser ki cookies control krne ke liye
export { app };