// routes/posts.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const slugify = require('slugify');

// --- CREATE a post ---
router.post('/', auth, async (req, res) => {
  try {
    const { title, heroImage, sections } = req.body;
    if (!title || !sections) {
      return res.status(400).json({ msg: 'Title and sections are required.' });
    }

    let slug = slugify(title, { lower: true, strict: true });
    const existing = await Post.findOne({ slug });
    if (existing) {
      slug += '-' + Date.now();
    }

    const post = new Post({
      title,
      slug,
      heroImage,
      sections,
      author: req.user.id,
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- GET ALL posts (Public) ---
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- GET SINGLE post by slug (Public) ---
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug }).populate('author', 'name');
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- UPDATE a post ---
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // // Only author can update
    // if (post.author.toString() !== req.user.id) {
    //   return res.status(403).json({ msg: 'You are not authorized to edit this post' });
    // }

    const { title, heroImage, sections } = req.body;
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: { title, heroImage, sections } },
      { new: true }
    );

    res.json(updatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// --- DELETE a post ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: 'Post not found' });

    // // Only author can delete
    // if (post.author.toString() !== req.user.id) {
    //   return res.status(403).json({ msg: 'You are not authorized to delete this post' });
    // }

    await post.deleteOne();
    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
