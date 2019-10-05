const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../../middleware/auth')

const Post = require('../../models/Post')
const User = require('../../models/User')

// @route POST api/posts
// @desc Create a post
// @access Private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      })

      const post = await newPost.save()

      res.json(post)
    } catch (err) {
      console.log(err.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route GET api/posts
// @desc Get all posts
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 })
    res.json(posts)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route GET api/posts/:postId
// @desc Get post by Id
// @access Private
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ msg: 'No post found for this id' })
    }

    res.json(post)
  } catch (err) {
    console.log(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found for this id' })
    }
    res.status(500).send('Server Error')
  }
})

// @route DELETE api/posts/:postId
// @desc Delete post by Id
// @access Private
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ msg: 'No post found for this id' })
    }

    //Check post belongs to the user before deleteing
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to delete post' })
    }

    await post.remove()

    res.json({ msg: 'Post successfully deleted' })
  } catch (err) {
    console.log(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found for this id' })
    }
    res.status(500).send('Server Error')
  }
})

// @route PUT api/posts/like/:postId
// @desc Like a post by Id
// @access Private
//todo see if you can make like and unlike in the same route
router.put('/like/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ msg: 'No post found for this id' })
    }

    //Check if user has already liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' })
    }

    post.likes.unshift({ user: req.user.id })
    post.save()
    res.json(post.likes)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route PUT api/posts/unlike/:postId
// @desc Remove Like from post by Id
// @access Private
//todo see if you can make like and unlike in the same route
router.put('/unlike/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ msg: 'No post found for this id' })
    }

    //Check if user has already liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'Post has not been liked' })
    }

    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id)

    post.likes.splice(removeIndex, 1)
    await post.save()
    res.json(post.likes)
  } catch (err) {
    console.log(err.message)
    res.status(500).send('Server Error')
  }
})

// @route PUT api/posts/comment/:postId
// @desc Comment on a post by Id
// @access Private
router.put(
  '/comment/:postId',
  [
    auth,
    [
      check('text', 'Comment text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')
      const post = await Post.findById(req.params.postId)

      if (!post) {
        return res.status(404).json({ msg: 'No post found for this id' })
      }

      const newComment = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar
      }

      post.comments.unshift(newComment)
      await post.save()
      res.json(post.comments)
    } catch (error) {
      console.log(error.message)
      res.status(500).send('Server Error')
    }
  }
)

// @route DELETE api/posts/comment/:postId/:commentId
// @desc Delete comment by Id
// @access Private
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)

    if (!post) {
      return res.status(404).json({ msg: 'No post found for this id' })
    }

    //Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.commentId
    )

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'No comment found for this id' })
    }

    //Check comment belongs to the user before deleteing
    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete comment' })
    }

    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id)

    post.comments.splice(removeIndex, 1)
    await post.save()

    res.json({ msg: 'Comment successfully deleted' })
  } catch (err) {
    console.log(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'No post found for this id' })
    }
    res.status(500).send('Server Error')
  }
})

module.exports = router
