// index.js

import express from 'express';
import connectDb from './utils/DbConfig.js';
import { configDotenv } from 'dotenv';
import userRouter from './routes/userRouter.js';
import eventRouter from './routes/eventRouter.js';
import { datingRouter } from './routes/datingRouter.js';
import authRouter from './routes/authRouter.js';
configDotenv();

const app = express();
// Enable this if you are behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
//app.set('trust proxy', 1);
const PORT = process.env.PORT;

/* const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        success: false,
        msg: "Too many requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}); */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//app.use(cors());


//app.use(globalLimiter); // This must be placed BEFORE your routes

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/event", eventRouter);
app.use("/api/date", datingRouter);

app.listen(PORT, () => {
    connectDb();
    console.log(`server listening to: http://localhost:${PORT}`)
})
