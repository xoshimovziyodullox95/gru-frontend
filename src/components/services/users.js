// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Location = require('../models/Location');
const Equipment = require('../models/Equipment');
const ServiceProvider = require('../models/ServiceProvider');
const auth = require('../middleware/auth');

// GET /api/users – barcha foydalanuvchilar (o‘zidan tashqari)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('fullName email avatar_url _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/search?q=...
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }).select('fullName email avatar_url _id');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('fullName email avatar_url _id');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/locations
router.get('/:id/locations', auth, async (req, res) => {
  try {
    const locations = await Location.find({ userId: req.params.id });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/equipment
router.get('/:id/equipment', auth, async (req, res) => {
  try {
    const equipment = await Equipment.find({ userId: req.params.id });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id/services
router.get('/:id/services', auth, async (req, res) => {
  try {
    const services = await ServiceProvider.find({ userId: req.params.id });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;