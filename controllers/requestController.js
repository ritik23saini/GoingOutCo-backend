import mongoose from "mongoose";
import Event from "../models/Event.js";
import JoinRequest from "../models/JoinRequest.js";
import Attendees from "../models/Attendees.js";

export const getEventRequests = async (req, res) => {
    const { eventId } = req.params;
    const currentUserId = req.user._id;

    try {
        const event = await Event.findOne({ _id: eventId, hostId: currentUserId });

        if (!event) {
            return res.status(200).json({ success: false, msg: "Event not found or you are not the host" });
        }

        // 2. Fetch Requests
        const requests = await JoinRequest.find({ eventId })
            .populate('users', 'name ') // Populate user details
            .sort({ requestedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error("Get join requests error:", error.message);
        return res.status(500).json({ success: false, msg: "Server Error" });
    }
};

export const sendEventrequest = async (req, res) => {
    const { eventId } = req.params;
    const currentUserId = req.user._id;
    const { partnerId /* = "696610aeff94f4eb99721467" */ } = req.body;
    console.log(eventId, currentUserId, partnerId)
    try {
        // Find specific event by ID
        const event = await Event.findById(eventId).lean();
        if (!event) {
            return res.status(200).json({ success: false, msg: "Event not found" });
        }

        let users = [currentUserId];
        if (partnerId) {
            if (!mongoose.Types.ObjectId.isValid(partnerId)) {
                return res.status(400).json({ success: false, msg: "Invalid partner ID" });
            }
            users.push(partnerId);
        }
        console.log("users", users)
        const checkExistingRequest = await JoinRequest.findOne({ eventId, users: { $in: users } })

        if (checkExistingRequest) {
            return res.status(403).json({ success: false, msg: "Request already sent" });
        }
        // Validate partner if provided

        if (event.price === 0 && event.entryType === "invite-only") {
            console.log("event")
            const joinRequest = await JoinRequest.create({
                eventId,
                users,
                joinedAs: users.length === 2 ? "couple" : "single",
                status: "pending"
            });

            return res.status(201).json({
                success: true,
                msg: "Join request sent",
                // data: joinRequest
            });
        }
        else {
            // Paid events → redirect to payment flow
            return res.status(200).json({
                success: true,
                msg: "Proceed to payment",
                price: event.price,
                isPaidEvent: true
            });
        }

    } catch (error) {
        console.error("Join event error:", error.message);
        return res.status(500).json({ success: false, msg: "Server error" });
    }
};

export const withdrawEvent = async (req, res) => {
    const { eventId } = req.params;
    const currentUserId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        //  remove a Confirmed Ticket (Attendee) first

        const removedAttendee = await Attendees.findOneAndDelete({
            eventId,
            users: currentUserId
        }).session(session);

        if (removedAttendee) {

            const headcountToRemove = removedAttendee.users.length; // 1 or 2

            await Event.findByIdAndUpdate(
                eventId,
                { $inc: { currentAttendee: -headcountToRemove } },
                { session }
            );


            await JoinRequest.findOneAndDelete({
                eventId,
                users: currentUserId
            }).session(session);

            await session.commitTransaction();
            return res.status(200).json({ success: true, msg: "Ticket cancelled. You have withdrawn." });
        }

        // If no ticket, try to remove a Pending Request
        const removedRequest = await JoinRequest.findOneAndDelete({
            eventId,
            users: currentUserId
        }).session(session);

        if (removedRequest) {
            // We do NOT decrement count because they never took a spot!

            await session.commitTransaction();
            return res.status(200).json({ success: true, msg: "Join request withdrawn successfully." });
        }

        // STEP 3: Neither found
        await session.abortTransaction();
        return res.status(404).json({ success: false, msg: "You have not joined this event." });

    } catch (error) {
        console.error("withdraw event error:", error);
        await session.abortTransaction();
        return res.status(500).json({ success: false, msg: "Error processing withdrawal" });
    } finally {
        session.endSession();
    }
};

//accept/reject multiple join requests 
// for free-invite event only
export const handleJoinRequests = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { eventId, requests } = req.body;

        // 1. Fetch Event
        const event = await Event.findById(eventId).session(session);
        if (!event) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, msg: "Event not found" });
        }

        if (!requests || requests.length === 0) {
            return res.status(400).json({ success: false, msg: "No requests provided" });
        }

        // 2. Separate the "Accepted" requests to check capacity
        // We ignore "rejected" ones for capacity calculation
        const requestsToAccept = requests.filter(r => r.status === "accepted");
        const requestIdsToAccept = requestsToAccept.map(r => r.request_id);
        console.log("docsToCheck:", requestsToAccept, requestIdsToAccept);

        let totalPeopleToAdd = 0;

        // Only do strict checks if we are actually accepting someone
        if (requestIdsToAccept.length > 0) {
            // Fetch the full documents to see how many people are in each request (Single vs Couple)
            const docsToCheck = await JoinRequest.find({ _id: { $in: requestIdsToAccept } }).session(session);
            console.log("docsToCheck:", docsToCheck);

            // Calculate headcount (e.g., Couple = 2 people)
            totalPeopleToAdd = docsToCheck.reduce((acc, req) => acc + req.users.length, 0);
            console.log("Total People to Add:", totalPeopleToAdd);

            // Check Capacity
            if (event.currentAttendee + totalPeopleToAdd > event.maxAttendee) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    msg: `Capacity exceeded! You selected ${totalPeopleToAdd} people, but only ${event.maxAttendee - event.currentAttendee} spots are left.`
                });
            }

            //  Create Attendees (Only for Accepted)

            const newAttendees = docsToCheck.map(reqDoc => ({
                eventId: reqDoc.eventId,
                users: reqDoc.users,
                joinedAs: reqDoc.joinedAs,
                status: "going",
                paymentStatus: "free",
                ticketCode: `GO-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
            }));

            const insertedAttendees = await Attendees.insertMany(newAttendees, { session });

            console.log("Inserted Attendees:", insertedAttendees);

            // 4. Update Event Count (Only for Accepted)
            await Event.findOneAndUpdate(
                { _id: eventId },
                { $inc: { currentAttendee: totalPeopleToAdd } },
                { session }
            );
        }

        //  marks rejected users as "rejected" and accepted ones as "accepted" in one go
        const bulkOps = requests.map((reqItem) => ({
            updateOne: {
                filter: { _id: reqItem.request_id },
                update: { status: reqItem.status }
            }
        }));

        await JoinRequest.bulkWrite(bulkOps, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, msg: "Requests processed successfully" });

    } catch (error) {
        await session.abortTransaction();
        console.error("Handle Requests Error:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, msg: "One or more users are already on the attendee list." });
        }
        res.status(500).json({ success: false, msg: error.message });
    } finally {
        session.endSession();
    }
};
