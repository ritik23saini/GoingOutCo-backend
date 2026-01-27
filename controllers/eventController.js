// controllers/event.controller.js
import Event from "../models/Event.js";
import JoinRequest from "../models/JoinRequest.js";
import mongoose from 'mongoose'
import HostRating from "../models/HostRating.js";
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      hostId,
      coverimage,
      imageUrls = [],
      location,
      startAt,
      endAt,
      price,
      isExclusive,
      requestMode,
      chatEnabled,
      country,
      currency,
      currencySymbol,
      status
    } = req.body;

    //   field check
    if (
      !title ||
      !description ||
      !category ||
      !hostId ||
      !location ||
      !location.coordinates ||
      !startAt ||
      !endAt
    ) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields"
      });
    }

    //  Date validation
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        msg: "endAt must be greater than startAt"
      });
    }

    //  Coordinates validation
    if (
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        msg: "Coordinates must be [longitude, latitude]"
      });
    }

    //  Create Event
    const event = await Event.create({
      title,
      description,
      category,
      hostId,
      coverimage,
      imageUrls,
      location: {
        type: "Point",
        coordinates: location.coordinates,
        name: location.name,
        city: location.city
      },
      startAt: startDate,
      endAt: endDate,
      price,
      country,
      currency,
      currencySymbol,
      status
    });

    return res.status(201).json({
      success: true,
      msg: "Event published successfully",
      data: event
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      msg: "Event creation fail"
    });
  }
};

export const getUserHostedEvent = async (req, res) => {
  //from event model
  const myUserId = req.user._id;
  try {
    const hostedEvent = await Event.find({ hostId: myUserId }).sort("createadAt").lean();

    if (!hostedEvent) {
      return res.status(400).json({ success: false, msg: "No event hosted" });
    }

    const requests = await JoinRequest.countDocuments({ eventId: hostedEvent._id });

    let enrichedData = {
      title,
      description,
      category,
      coverimage,
      startAt,
      endAt,
      requests,
    };
    return res.status(200).json({ success: true, data: hostedEvent });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ success: false, msg: "ERROR IN getUserHostedEvent" });
  }
}

export const getJoinRequests = async (req, res) => {
  const { eventId } = req.params;
  const currentUserId = req.user._id;
  const { partnerId /* = "696610aeff94f4eb99721467" */ } = req.body;
  console.log(eventId, currentUserId, partnerId)
  try {
    // Find specific event by ID
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ success: false, msg: "Event not found" });
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
    console.error("withdraw event error:", error.message)
    return res.status(500).json({ success: false, msg: "ERROR IN withdrawEvent" });
  }
};

export const getUserEvents = async (req, res) => {
  const currentUserId = req.user._id;
  const { type, limit = 10, page = 1 } = req.query;

  const skip = (page - 1) * limit;

  let events = [];

  switch (type) {
    case 'hosted':
      // User's hosted events
      events = await Event.find({
        hostId: currentUserId
      })
        //.populate('hostId', 'name')
        //.select('hostId name')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit * 1)
        .skip(skip)
        .lean();

      /*  let enrichedData = event.map(e => {
 
       }) */
      break;

    case 'requested':
      // Events user requested to join
      events = await JoinRequest.find({
        users: currentUserId
      })
        // .populate('hostId', 'name')
        .sort({ requestedAt: -1 })
        .limit(limit * 1)
        .skip(skip)
        .lean();
      break;

    case 'saved':
      events = await Event.find({
        hostId: currentUserId
      })
        // .populate('hostId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip(skip)
        .lean();
      break;

    default:
      return res.status(400).json({
        success: false,
        msg: "Invalid type. Use: hosted, requested, saved"
      });
  }

  // Get total count for pagination
  const total = await getTotalCount(type, currentUserId);
  return res.json({
    success: true,
    data: events,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
};

const getTotalCount = async (type, currentUserId) => {
  switch (type) {
    case 'hosted':
      return await Event.countDocuments({ hostId: currentUserId });

    case 'requested':
      return await JoinRequest.countDocuments({
        users: currentUserId
      });

    case 'saved':
      //  FIX THIS - currently same as hosted!
      // Add savedBy field to Event schema OR create SavedEvents collection
      return await Event.countDocuments({
        savedBy: currentUserId
        // OR if using separate collection:
        // SavedEvent.countDocuments({ userId: currentUserId })
      });

    default:
      return 0;
  }
};

export const getEventDetails = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).select('-currentAttendee -isExclusive -status')
      .populate('hostId', 'name profilePic')
      .lean();
    if (!event) {
      return res.status(404).json({ success: false, msg: "event not found" });
    }

    const hostRating = await HostRating.findOne({ hostId: event.hostId }).select("-hostId").lean();

    const host = {
      name: event.hostId.name,
      avg: hostRating?.ratingAvg || 0,
      count: hostRating?.ratingCount || 0,
      profilePic: event.hostId.profilePic || null
    };
    return res.status(200).json({
      success: true,
      data: { host, ...event }
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, msg: "ERROR IN getEventDetails" });
  }
}

export const joinEvent = async (req, res) => {
  const { eventId } = req.params;
  const currentUserId = req.user._id;
  const { partnerId /* = "696610aeff94f4eb99721467" */ } = req.body;
  console.log(eventId, currentUserId, partnerId)
  try {
    // Find specific event by ID
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json({ success: false, msg: "Event not found" });
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
      return res.status(404).json({ success: false, msg: "no join request found" });
    }
    return res.status(200).json({ success: true, msg: "You have Withdrawn from event" });

  } catch (error) {
    console.error("withdraw event error:", error.message)
    return res.status(500).json({ success: false, msg: "ERROR IN withdrawEvent" });
  }
};
