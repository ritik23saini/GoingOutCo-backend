// index.js

import express from 'express';
import connectDb from './utils/DbConfig.js';
import { configDotenv } from 'dotenv';
import userRouter from './routes/userRouter.js';
import eventRouter from './routes/eventRouter.js';
import { datingRouter } from './routes/datingRouter.js';
configDotenv();

const app = express();
const PORT = process.env.PORT;


app.use(express.json());
app.use("/api/user", userRouter);
app.use("/api/event", eventRouter);
app.use("/api/date", datingRouter);
app.listen(PORT, () => {
    connectDb();
    console.log(`server listening to: http://localhost:${PORT}`)
})
