const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  try {
    const blogs = await Blog.find({})
    response.json(blogs)
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'internal error' })
  }
})

blogsRouter.post('/', async (request, response) => {
  try {
    const blog = new Blog(request.body)
    const result = await blog.save()
    response.status(201).json(result)
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'internal error' })
  }
})

module.exports = blogsRouter