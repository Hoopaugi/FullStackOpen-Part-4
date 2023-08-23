const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({})

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

blogsRouter.post('/', async (req, res) => {
  const blog = new Blog({ ...req.body })

  const savedBlog = await blog.save()

  res.status(201).json(savedBlog)

})

blogsRouter.delete('/:id', async (req, res) => {
  await Blog.findByIdAndRemove(req.params.id)

  res.status(204).end()
})

blogsRouter.put('/:id', async (req, res) => {
  const blog = { ...req.body }

  const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, blog, { new: true, upsert: false })

  res.json(updatedBlog)
})

module.exports = blogsRouter