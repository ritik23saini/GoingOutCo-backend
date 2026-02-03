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

export const joinEvent = async (req, res) => {
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
                joinedAs: users.length === 2 ? "couple" : "single"
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
    console.log(currentUserId)
    try {

        const withdraw = await JoinRequest.findOneAndDelete({ eventId, users: { $in: [currentUserId] } }).lean();
        if (!withdraw) {
            return res.status(200).json({ success: false, msg: "no join request found" });
        }
        return res.status(200).json({ success: true, msg: "You have Withdrawn from event" });

    } catch (error) {
        console.error("withdraw event error:", error.message)
        return res.status(500).json({ success: false, msg: "ERROR IN withdrawEvent" });
    }
};

//accept/reject multiple join requests
export const handleJoinRequests = async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { requests } = req.body; // Array of { request_id, status }

        if (!requests || requests.length === 0) {
            return res.status(400).json({ success: false, msg: "No requests provided" });
        }

        const bulkOps = requests.map((reqItem) => ({
            updateOne: {
                filter: { _id: reqItem.request_id }, // Target by unique Request ID
                update: { status: reqItem.status }
            }
        }));

        // Execute all status updates in one go
        await JoinRequest.bulkWrite(bulkOps, { session });

        // Move to Attendee Table
        const acceptedRequestsIds = requests
            .filter(r => r.status === "accepted")
            .map(r => r.request_id);

        if (acceptedRequestsIds.length > 0) {
            // Fetch the full request details for these IDs to get user/event info
            const fullRequests = await JoinRequest.find({ _id: { $in: acceptedRequestsIds } }).session(session);

            // Create Attendee documents
            const newAttendees = fullRequests.map(reqDoc => ({
                eventId: reqDoc.eventId,
                users: reqDoc.users, // Copy the array of users (1 or 2)
                joinedAs: reqDoc.joinedAs,
                //ticketCode: `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate unique code
                //status: "going",
                paymentStatus: "free" // Default to free
            }));

            // Insert all new attendees at once
            await Attendees.insertMany(newAttendees, { session });
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, msg: "Attendees confirmed successfully" });

    } catch (error) {
        await session.abortTransaction();
        console.error("Bulk Update Error:", error);
        res.status(500).json({ success: false, msg: error.message });
    } finally {
        session.endSession();
    }
};
