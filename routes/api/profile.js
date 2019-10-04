const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')

const User = require('../../models/User')
const Profile = require('../../models/Profile')

const { check, validationResult } = require('express-validator')

// @route GET api/profile/me
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

// @route POST api/profile
// @desc Create or update a user profile
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubUsername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body

    //Build profile object
    const profileFields = {}
    profileFields.user = req.user.id
    profileFields.status = status
    profileFields.skills = skills.split(',').map(skill => skill.trim())
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (githubUsername) profileFields.githubUsername = githubUsername

    //Build social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube
    if (facebook) profileFields.social.facebook = facebook
    if (twitter) profileFields.social.twitter = twitter
    if (instagram) profileFields.social.instagram = instagram
    if (linkedin) profileFields.social.linkedin = linkedin

    try {
      let profile = await Profile.findOne({ user: req.user.id })

      if (profile) {
        //Update profile
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )
        return res.json(profile)
      }

      // Create
      profile = new Profile(profileFields)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.log(err.message)
      res.send(500).send('Server Error')
    }
  }
)

// @route GET api/profile
// @desc Get all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar'])
    res.json(profiles)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route GET api/profile/user/:userId
// @desc Get profile by userId
// @access Public
router.get('/user/:userId', async (req, res) => {
  //todo add express-validator on param
  try {
    const profile = await Profile.findOne({
      user: req.params.userId
    }).populate('user', ['name', 'avatar'])

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' })
    }

    res.json(profile)
  } catch (err) {
    console.log(err.message)
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' })
    }
    res.status(500).send('Server Error')
  }
})

// @route DELETE api/profile
// @desc Delete profile, user, & posts
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    //todo remove user posts

    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id })

    //remove user
    await User.findOneAndRemove({ _id: req.user.id })

    res.json({ msg: 'User removed' })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
