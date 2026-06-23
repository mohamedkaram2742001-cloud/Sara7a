import mongoose from "mongoose";
import { APPLICATION_NAME } from "../../../config/config.service.js";
import { deleteAttachments, uploadFiles } from "../../common/services/index.js";
import { BadRequestException, NotFoundException } from "../../common/utils/index.js";
import { createOne, deleteOne, findOne } from "../../DB/dataBase.service.js";
import { userModel, MessageModel } from "../../DB/models/index.js";

export const sendMessage = async (
  files = [],
  { content },
  receiverId,
  user,
) => {
  if (receiverId == user?._id) {
    throw BadRequestException({message : "Invalid action , You can't send a message to yourself"})
  }
  if(!files.length && ! content){
    throw BadRequestException({message : "You must provide either content or attachments"})
  }
  const receiver = await findOne({
    model: userModel,
    filter: { _id: receiverId, confirmEmail: { $exists: true } },
  });
  if (!receiver) {
    throw NotFoundException({ message: "No matching account" });
  }
  const baseFolder = `${APPLICATION_NAME}/messages/${receiverId}`;
  const attachments = await uploadFiles({
    files,
    folder: `${baseFolder}/attachments`,
  });
  const message = await createOne({
    model: MessageModel,
    data: {
      content,
      attachments,
      receiverId,
      senderId: user ? user._id : undefined,
    },
  });
  return message;
};
export const getMessage = async (messageId, user) => {
  const message = await MessageModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(messageId),
        $or: [{ senderId: user._id }, { receiverId: user._id }],
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiver",
      },
    },
    {
      $unwind: {
        path: "$receiver",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        direction: {
          $cond: [{ $eq: ["$senderId", user._id] }, "sent", "received"],
        },
      },
    },

    {
      $project: {
        content: 1,
        attachments: 1,
        createdAt: 1,
        updatedAt: 1,
        isRead: 1,
        direction: 1,
        senderId: 1,
        receiverId: 1,
        receiver: {
          _id: "$receiver._id",
          userName: "$receiver.userName",
          profilePicture: "$receiver.profilePicture.secure_url",
        },
      },
    },
  ]);

  if (!message.length) {
    throw NotFoundException({
      message: "Invalid message or not authorized action",
    });
  }

  return message[0];
};
export const getAllMessage = async (user) => {
  const message = await MessageModel.aggregate([
    {
      $match: {
        $or: [{ senderId: user._id }, { receiverId: user._id }],
      },
    },
    {
      $addFields: {
        direction: {
          $cond: [{ $eq: ["$senderId", user._id] }, "sent", "received"],
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "receiverId",
        foreignField: "_id",
        as: "receiver",
      },
    },
    {
      $unwind: {
        path: "$receiver",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        content: 1,
        attachments: 1,
        createdAt: 1,
        updatedAt: 1,
        isRead: 1,
        direction: 1,
        senderId: 1,
        receiverId: 1,
        receiver: {
          _id: "$receiver._id",
          userName: "$receiver.userName",
          profilePicture: "$receiver.profilePicture.secure_url",
        },
      },
    },
  ]);
console.log(message);

  return message;
};
export const deleteMessage = async (messageId, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
  });
  if (!message) {
    throw NotFoundException({
      message: "Invalid message or not authorized action",
    });
  }
  if (message?.attachments?.length) {
    await deleteAttachments({
      attachments: message.attachments,
      receiverId: user._id,
    });
  }
  await deleteOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      receiverId: user._id,
    },
  });
  return "Done";
};
export const markMessageAsRead = async (messageId, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: {
      _id: messageId,
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    },
  });

  if (!message) {
    throw NotFoundException({ message: "Message not found" });
  }

  if (
    message.receiverId.toString() === user._id.toString() &&
    !message.isRead
  ) {
    message.isRead = true;
    await message.save();
  }

  return message;
};
 