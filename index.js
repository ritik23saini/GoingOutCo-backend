// index.js

import express from 'express';
import connectDb from './utils/DbConfig.js';
import { configDotenv } from 'dotenv';

configDotenv();

const app = express();
const PORT = process.env.PORT;


app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello')
})

app.listen(PORT, () => {
    connectDb();
    console.log(`server listening to: http://localhost:${PORT}`)
})
