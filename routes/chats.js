var express = require('express');
var router = express.Router();
const { ObjectId } = require('mongodb');
const { checkToken } = require('../helpers/util');
const moment = require('moment')

module.exports = function (db) {

  const Chat = db.collection('chats');

  router.get('/:sender/:receiver', checkToken, async function (req, res, next) {
    try {
      const data = await Chat.find({
        $or: [
          { sender: req.params.sender, receiver: req.params.receiver },
          { sender: req.params.receiver, receiver: req.params.sender }
        ]
      }).toArray();

      await Chat.updateMany({
        sender: req.params.receiver,
        receiver: req.params.sender,
        isread: false
      }, {
        $set: { isread: true }
      })

      res.status(200).json(data.map(item => ({ ...item, time: moment(item._id.getTimestamp()).format('HH:mm:ss') })))
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.get('/:id', async function (req, res, next) {
    try {
      const data = await Chat.findOne({ _id: new ObjectId(req.params.id) });
      res.status(200).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.post('/', checkToken, async function (req, res, next) {
    try {
      const { message, sender, receiver } = req.body
      const data = await Chat.insertOne({ message, sender, receiver, isread: false })
      res.status(201).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.put('/:id', async function (req, res, next) {
    try {
      const { id } = req.params
      const data = await Chat.updateOne({ _id: new ObjectId(id) }, { $set: req.body })
      res.status(201).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.delete('/:id', async function (req, res, next) {
    try {
      const { id } = req.params
      const data = await Chat.deleteOne({ _id: new ObjectId(id) })
      res.status(200).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  return router;
}
