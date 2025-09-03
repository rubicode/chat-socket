var express = require('express');
const { hashPassword, generateToken, comparePassword } = require('../helpers/util');
var router = express.Router();
// const { ObjectId } = require('mongodb')

module.exports = function (db) {

  const User = db.collection('users');

  router.post('/register', async function (req, res, next) {
    try {
      const { username, password } = req.body
      const data = await User.insertOne({ username, password: hashPassword(password) })
      const token = generateToken({ userId: data.insertedId })
      const user = await User.findOne({ _id: data.insertedId })
      res.status(201).json({ token, username: user.username })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  router.post('/login', async function (req, res, next) {
    try {
      const { username, password } = req.body
      const user = await User.findOne({ username })

      if (!user) throw new Error('username not exist')

      if (!comparePassword(password, user.password)) throw new Error('password is wrong')

      const token = generateToken({ userId: user._id })
      res.status(201).json({ token, username: user.username })
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: error.message })
    }
  });

  return router;
}
