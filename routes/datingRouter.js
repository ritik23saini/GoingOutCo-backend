import express from 'express';
import { searchDates } from '../controllers/datingController.js';

export const datingRouter = express.Router();

datingRouter.get("/searchDates", searchDates);

//search date
