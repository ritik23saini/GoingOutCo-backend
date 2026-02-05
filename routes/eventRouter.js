
import express from 'express';
import { ensureAuth } from '../middlewares/ensureAuth.js';
import { createEvent, deleteEventPost, toggleFavourite, updateEventPost, getmanageEvents, getMyEventDetails, getOtherEventDetails } from '../controllers/eventController.js';
import { checkHostingLimit } from '../middlewares/checkHostingLimit .js';
import { getEventRequests, handleJoinRequests, sendEventrequest, withdrawEvent } from '../controllers/requestController.js';

const eventRouter = express.Router();

//myevent CRUD
eventRouter.post('/create', ensureAuth, checkHostingLimit, createEvent);
eventRouter.patch('/update/:eventId', ensureAuth, checkHostingLimit, updateEventPost);
eventRouter.delete('/delete/:eventId', ensureAuth, deleteEventPost);

//join/withdraw other events
eventRouter.post("/:eventId/join/", ensureAuth, sendEventrequest);
eventRouter.post("/:eventId/withdraw", ensureAuth, withdrawEvent);

eventRouter.post("/:eventId/toogle-favourite", ensureAuth, toggleFavourite);

// get my hosted events
eventRouter.get("/manage-events", ensureAuth, getmanageEvents); //manage events
eventRouter.get("/manage-events/:eventId", ensureAuth, getMyEventDetails); //manage events

//get myevent request
eventRouter.get("/requests/:eventId", ensureAuth, getEventRequests);
eventRouter.post("/request/update-status", ensureAuth, handleJoinRequests);
//get other event details
eventRouter.get("/getEventDetails/:eventId", getOtherEventDetails);


export default eventRouter;