import httpStatus from "http-status";
import mongoose from "mongoose";
import Message from "../../models/messageModal.js";
import User from "../../landing-server/models/user.model.js";

const getChats = async (req, res) => {
  try {
    const { senderId } = req.params;
    const { recieverId } = req.params;
    console.log(" req.params", req.params);
    await Message.updateMany(
      { receiver: senderId, sender: recieverId, isRead: false },
      {
        $set: {
          isRead: true,
        },
      },
      { upsert: false }
    );
    const messages = await Message.find({
      $or: [
        { receiver: recieverId, sender: senderId },
        { sender: recieverId, receiver: senderId },
      ],
    })
      .populate({
        path: "sender",
        select: { username: 1, profile: 1, firstName: 1 },
      })
      .populate({
        path: "receiver",
        select: { username: 1, profile: 1, firstName: 1 },
      });
    if (messages) {
      return res.status(200).send(messages);
    }
  } catch (err) {
    logger.info(JSON.stringify(err));
    throw new ApiError(httpStatus.UNAUTHORIZED, "Something went wrong!");
  }
};

const chatList = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      throw new Error("Send id is required.");
    }

    let IfUserExist = await User.findOne({ _id: userId });
    if (!IfUserExist) {
      return res.status(404).json({ msg: "User not found" });
    }

    const chatData = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId) },
            { receiver: mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      { $sort: { _id: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: {
                $eq: ["$sender", mongoose.Types.ObjectId(userId)],
              },
              then: "$receiver",
              else: "$sender",
            },
          },
          lastMessage: { $first: "$message" },
          date: { $first: "$createdAt" },
          totalMessage: { $sum: 1 },
          unReadMessages: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$isRead", false] },
                    { $ne: ["$sender", mongoose.Types.ObjectId(userId)] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          lastMessage: "$lastMessage",
          totalMessage: "$totalMessage",
          count: "$unReadMessages",
          date: "$date",
          "user._id": 1,
          "user.username": 1,
          "user.profile": 1,
        },
      },
    ]);
    // const unreadCount = await Message.countDocuments({
    //   $and: [
    //     { $or: [{ sender: mongoose.Types.ObjectId(senderId) }, { receiver: mongoose.Types.ObjectId(senderId) }] },
    //     { isRead: false },
    //   ],
    // });
    const unreadCount = await Message.countDocuments({
      $and: [{ receiver: mongoose.Types.ObjectId(userId) }, { isRead: false }],
    });
    return res.status(200).json({ chatData, unreadCount });
  } catch (err) {
    logger.info(JSON.stringify(err));
    throw new ApiError(httpStatus.UNAUTHORIZED, "Something went wrong!");
  }
};

// exports.getOnlineUsers = (req, res) => {
//   Socket.find()
//     .select('user._id')
//     .exec((err, result) => {
//       if (err || !result) {
//         return res.status(400).json({
//           error: err,
//         });
//       }
//       res.json(result);
//     });
// };

const chatCotroller = {
  getChats,
  chatList,
};
export default chatCotroller;
