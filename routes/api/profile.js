const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')

const User = require('../../models/User')
const Profile = require('../../models/Profile')

// @route GET api/profiles/me
// @desc Get current user profile
// @access Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['name', 'avatar']
    )

    //todo string interpolation
    if (!profile) {
      return res.status(401).json({ msg: 'No profile found for this user.' })
    }

    res.json(profile)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
