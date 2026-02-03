// controllers/event.controller.js
import Event from "../models/Event.js";
import JoinRequest from "../models/JoinRequest.js";
import mongoose from 'mongoose'
import HostRating from "../models/HostRating.js";
import FavoritesEvents from "../models/FavoritesEvents.js";
import Attendees from "../models/Attendees.js";

export const createEvent = async (req, res) => {
  try {

    const {
      title, description, category, coverimage, imageUrls = [],
      location, startAt, endAt, price, country, currency, currencySymbol, status
    } = req.body;
    const hostId = req.user._id;
    console.log("req.body:", req.body, hostId);

    if (!title || !description || !category || !location || !location.coordinates || !startAt || !endAt) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
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

    if (!Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
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
      price, country, currency, currencySymbol, status
    });

    if (req.userSubscription) {
      req.userSubscription.hostUsedThisMonth += 1;
      await req.userSubscription.save();

      /* 
      it is not possible if .lean () was used on findone in middleware
      This is the "magic" of Mongoose! It can be confusing because standard JavaScript objects don't work this way.

      The secret is that req.userSubscription is NOT just a plain data object (like JSON). It is a Mongoose Document (Instance).

      When your middleware ran UserSubscription.findOne(...), Mongoose didn't just fetch the data; it created a special "smart object" that remembers exactly where it came from in the database.
      */
    }
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



export const getmanageEvents = async (req, res) => {
  const currentUserId = req.user._id;
  const { type, limit = 10, page = 1 } = req.query;

  const skip = (page - 1) * limit;

  let events = [];

  switch (type) {
    case 'hosted':
      // User's hosted events


      /*   events = await Event.find({
          hostId: currentUserId
        })
          //.populate('hostId', 'name')
          //.select('hostId name')
          .sort({ updatedAt: -1, createdAt: -1 })
          .limit(limit * 1)
          .skip(skip)
          .lean(); */

      events = await Event.aggregate([
        { $match: { hostId: new mongoose.Types.ObjectId(currentUserId) } },
        {
          $lookup: {
            from: 'joinrequests',
            localField: '_id',
            foreignField: 'eventId',
            as: 'joinRequests'
          }
        },
        { $addFields: { requestCount: { $size: '$joinRequests' } } },
        { $project: { title: 1, coverimage: 1, startAt: 1, endAt: 1, requestCount: 1, status: 1 } },
        { $sort: { status: -1, updatedAt: -1, createdAt: -1 } },
        //staus live then draft then completed reverse alphabeth with -1
        { $skip: skip },
        { $limit: limit * 1 }
      ])

      console.log("event1", events);

      break;

    case 'requested':
      // Events user requested to join
      events = await JoinRequest.find({
        users: currentUserId
      })
        .populate('eventId', 'title coverimage startAt endAt')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip(skip)
        .lean();
      break;

    case 'saved':
      //favourite model
      const favRecords = await FavoritesEvents.find({ userId: currentUserId })
        .sort({ createdAt: -1 })
        .lean();

      // Extract event IDs
      const favEventIds = favRecords.map(f => f.eventId);

      // Fetch the actual Event details
      events = await Event.find({ _id: { $in: favEventIds } })
        .select('eventId title coverimage startAt endAt')
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
      return await FavoritesEvents.countDocuments({ userId: currentUserId });

    default:
      return 0;
  }
};

export const getOtherEventDetails = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).select('-currentAttendee -isExclusive -status')
      .populate('hostId', 'name profilePic')
      .lean();
    if (!event) {
      return res.status(200).json({ success: false, msg: "event not found" });
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


export const getMyEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;
    const currentUserId = req.user._id;
    let id = new mongoose.Types.ObjectId(eventId)
    console.log(id, currentUserId)

    const [event, acceptedCount, pendingCount] = await Promise.all([
      Event.findOne({ _id: id, hostId: currentUserId }).populate("hostId", "name profilePic").select('-currentAttendee -isExclusive -boostMultiplier -boostTier'),
      //  HostRating.findOne({ hostId: currentUserId }).select("-hostId").lean(),
      Attendees.countDocuments({ eventId: id }),
      JoinRequest.countDocuments({ eventId: id, status: "pending" }),
    ]);

    if (!event || event.length === 0) {
      return res.status(404).json({ success: false, msg: "Event not found" });
    }

    const hostRating = await HostRating.findOne({ hostId: currentUserId }).select("-hostId").lean();

    const hostDetails = {
      name: event.hostId.name,
      avg: hostRating?.ratingAvg || 0,
      count: hostRating?.ratingCount || 0,
    };

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),// Convert mongoose doc to object
        hostDetails,
        stats: {
          accepted: acceptedCount, // The "5" in your design
          pending: pendingCount    // The "52" in your design
        },
        // myStatus // Helps frontend show "Requested" or "Join" button
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
};

export const toggleFavourite = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  try {
    const exists = await FavoritesEvents.findOne({ userId, eventId });

    if (exists) {
      await FavoritesEvents.deleteOne({ _id: exists._id });

      return res.status(200).json({
        success: true,
        isFavourite: false,
        msg: "Removed from favourites",
      });
    }

    await FavoritesEvents.create({ userId, eventId });

    return res.status(200).json({
      success: true,
      isFavourite: true,
      msg: "Added to favourites",
    });

  } catch (error) {
    console.error("toggleFavourite error:", error.message);

    // duplicate key safety (race condition)
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        isFavourite: true,
      });
    }

    return res.status(500).json({
      success: false,
      msg: "ERROR IN toggleFavourite",
    });
  }
};


export const deleteEventPost = async (req, res) => {
  const { eventId } = req.params;
  const currentUserId = req.user._id;

  // disucc when to delete event was thier attende already exist paid event then refund or not etc
  //need more development not final api
  try {
    const event = await Event.findOne({ _id: eventId, hostId: currentUserId });

    if (!event) {
      return res.status(404).json({ success: false, msg: "Event not found" });
    }

    // 2. Delete the Event
    await Event.findByIdAndDelete(eventId);

    //  CONDITIONAL REFUND LOGIC
    // ONLY decrement if the status was 'draft'. 
    // Live, Completed, or Cancelled events count as "spent".
    if (event.status === 'draft') {

      const sub = await UserSubscription.findOne({ userId: currentUserId });

      // Safety check: ensure we don't go below 0
      if (sub && sub.hostUsedThisMonth > 0) {
        sub.hostUsedThisMonth -= 1;
        await sub.save();
        console.log(`Refunded 1 credit to user ${currentUserId}`);
      }
    }

    return res.status(200).json({
      success: true,
      msg: "Event deleted successfully",
      refunded: event.status === 'draft' // Tell frontend if credit was returned
    });

  } catch (error) {
    console.error("deleteEventPost error:", error.message);
    return res.status(500).json({ success: false, msg: "Server Error" });
  }
};

// pause or update event 
export const updateEventPost = async (req, res) => {
  const { eventId } = req.params;
  const currentUserId = req.user._id;

  const allowedFields = [
    "title", "description", "category", "coverimage", "imageUrls",
    "location", "startAt", "endAt", "entryType", "price", "status"
  ];

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, msg: "Empty body" });
  }

  if (req.userSubscription) {
    req.userSubscription.hostUsedThisMonth += 1;
    await req.userSubscription.save();
  }
  try {
    const event = await Event.findOne({ _id: eventId, hostId: currentUserId });

    if (!event) {
      return res.status(404).json({ success: false, msg: "Event not found or unauthorized" });
    }

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        event[key] = req.body[key];
      }
    }

    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);

    if (startDate >= endDate) {
      return res.status(400).json({ success: false, msg: "End date must be after Start date" });
    }


    if (req.body.location) {
      if (!Array.isArray(event.location.coordinates) || event.location.coordinates.length !== 2) {
        return res.status(400).json({ success: false, msg: "Coordinates must be [longitude, latitude]" });
      }
    }


    const updatedEvent = await event.save();

    return res.status(200).json({
      success: true,
      msg: "Event updated successfully",
      data: updatedEvent,
    });

  } catch (error) {
    console.error("updateEvent error:", error.message);
    return res.status(500).json({ success: false, msg: "Server Error" });
  }
};

export const getallEvent = async (req, res) => {
  const params = req.query

  try {

    const event = await Event.find().lean();
    if (!event) {
      return res.status(200).json({ success: false, msg: "event not found" });
    }

    return res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, msg: "ERROR IN getEventDetails" });
  }
}

export const getEventByLocation = async (req, res) => {

  const { search, page, limit, date, distance, price } = req.query

  try {
    const event = await Event.find().lean();
    if (!event) {
      return res.status(200).json({ success: false, msg: "event not found" });
    }


    return res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, msg: "ERROR IN getEventDetails" });
  }
}