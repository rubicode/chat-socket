var express = require('express');
var router = express.Router();
const { ObjectId } = require('mongodb');
const { checkToken } = require('../helpers/util');

module.exports = function (db) {

  const User = db.collection('users');
  const Chat = db.collection('chats');

  router.get('/', checkToken, async function (req, res, next) {
    try {
      const data = await User.find({}).toArray();
      res.status(200).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.get('/:id', async function (req, res, next) {
    try {
      const data = await User.findOne({ _id: new ObjectId(req.params.id) });
      res.status(200).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.get('/:username/friend', async function (req, res, next) {
    try {
      const users = await User.aggregate([
        {
          $match: {
            username: { $ne: req.params.username }
          }
        },
        {
          $lookup: {
            from: "chats",
            let: { receiver: "$username" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$sender", "$$receiver"] }, // receiver is other user
                      { $eq: ["$receiver", req.params.username] }, // sender is current user
                      { $eq: ["$isread", false] }
                    ]
                  }
                }
              },
              { $count: "unreadCount" }
            ],
            as: "unreadMessages"
          }
        },
        {
          $addFields: {
            unreadCount: {
              $ifNull: [{ $arrayElemAt: ["$unreadMessages.unreadCount", 0] }, 0]
            }
          }
        },
        {
          $lookup: {
            from: "chats",
            let: { friend: "$username" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      {
                        $and: [
                          { $eq: ["$sender", req.params.username] },
                          { $eq: ["$receiver", "$$friend"] }
                        ]
                      },
                      {
                        $and: [
                          { $eq: ["$sender", "$$friend"] },
                          { $eq: ["$receiver", req.params.username] }
                        ]
                      }
                    ]
                  }
                }
              },
              { $sort: { _id: -1 } }, // Sort by newest first using ObjectId
              { $limit: 1 }
            ],
            as: "lastChat"
          }
        },
        {
          $addFields: {
            lastChat: { $arrayElemAt: ["$lastChat", 0] } // Extract single object
          }
        },
        {
          $project: {
            unreadMessages: 0
          }
        }
      ]).toArray();

      res.json(users)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.post('/', async function (req, res, next) {
    try {
      const { username, address } = req.body
      const data = await User.insertOne({ username, address })
      res.status(201).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.put('/:id', async function (req, res, next) {
    try {
      const { id } = req.params
      const data = await User.updateOne({ _id: new ObjectId(id) }, { $set: req.body })
      res.status(201).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.delete('/:id', async function (req, res, next) {
    try {
      const { id } = req.params
      const data = await User.deleteOne({ _id: new ObjectId(id) })
      res.status(200).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  return router;
}
