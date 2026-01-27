
import express from 'express';
import { ensureAuth } from '../middlewares/ensureAuth.js';
import { createEvent, getEventDetails, getJoinRequests, getUserEvents, joinEvent, withdrawEvent, } from '../controllers/eventController.js';

const eventRouter = express.Router();


eventRouter.post('/create', createEvent);
eventRouter.post('/delete', ensureAuth, createEvent);
eventRouter.post('/delete', ensureAuth, createEvent);


eventRouter.post("/join/:eventId", ensureAuth, joinEvent);
eventRouter.post("/withdraw-/:eventId", ensureAuth, withdrawEvent);

eventRouter.get("/getUserEvents", ensureAuth, getUserEvents); //manage events
eventRouter.get("/getEventDetails/:eventId", getEventDetails);
eventRouter.get('/getEventRequest', ensureAuth, getJoinRequests);


export default eventRouter;