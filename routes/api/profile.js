const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const request = require('request')
const User = require('../../models/User')
const Profile = require('../../models/Profile')
const config = require('config')

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

// @route PUT api/profile/experience
// @desc Add profile experience
// @access Private
//todo add update experience route
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
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
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id })
      profile.experience.unshift(newExp)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server Error.')
    }
  }
)

// @route DELETE api/profile/experience/:expId
// @desc Delete profile experience
// @access Private
//todo validation that expId is an ObjectId in mongoose -can delete just 0 and 1
router.delete('/experience/:expId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    //get remove index
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.expId)

    profile.experience.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)
  } catch (err) {
    console.log(err.messgae)
    res.status(500).send('Server Error')
  }
})

// @route PUT api/profile/eduction
// @desc Add profile eductation
// @access Private
//todo add update education route
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required')
        .not()
        .isEmpty(),
      check('degree', 'Degree is required')
        .not()
        .isEmpty(),
      check('fieldOfStudy', 'Field of Study is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
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
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    }
    try {
      const profile = await Profile.findOne({ user: req.user.id })
      profile.education.unshift(newEdu)
      await profile.save()
      res.json(profile)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server Error.')
    }
  }
)

// @route DELETE api/profile/education/:eduId
// @desc Delete profile education
// @access Private
//todo validation that eduId is an ObjectId in mongoose -can delete just 0 and 1
router.delete('/education/:eduId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })

    //get remove index
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.eduId)

    profile.education.splice(removeIndex, 1)

    await profile.save()

    res.json(profile)
  } catch (err) {
    console.log(err.messgae)
    res.status(500).send('Server Error')
  }
})

// @route DELETE api/profile/github/:username
// @desc Get user repos from Github
// @access Public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    request(options, (error, response, body) => {
      if (error) console.error(error)

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' })
      }

      res.json(JSON.parse(body))
    })
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

module.exports = router
