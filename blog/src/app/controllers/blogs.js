const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })

  res.json(blogs)
})

blogsRouter.get('/:id', async (req, res) => {
  const blog = await Blog.findById(req.params.id)

  if (blog) {
    res.json(blog)
  } else {
    res.status(404).end()
  }
})

blogsRouter.post('/', middleware.userExtractor, async (req, res) => {
  const body = req.body

  const user = req.user

  const blog = new Blog({ ...body, user: user.id })

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)

  await user.save()

  res.status(201).json(savedBlog)

})

blogsRouter.delete('/:id', middleware.userExtractor, async (req, res) => {
  const user = req.user

  const blog = await Blog.findById(req.params.id)

  if (blog.user.toString() === user.id.toString()) {
    await blog.deleteOne()
    res.status(204).end()
  } else {
    return res.status(401).json({ error: 'not owner' })
  }
})

blogsRouter.put('/:id', async (req, res) => {
  const blog = { ...req.body }

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true, upsert: false })

  res.json(updatedBlog)
})

module.exports = blogsRouter