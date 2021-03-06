const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (request, response) => {
  try {
    const blogs = await Blog
      .find({})
      .populate('user', { username: 1, name: 1 })
    response.json(blogs.map(Blog.format))
  } catch (exception) {
    console.log(exception)
    response.status(500).json({ error: 'internal error' })
  }
})

blogsRouter.post('/', async (request, response) => {
  try {
    if (!request.token) {
      return response.status(401).json({ error: 'token missing' })
    }
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const body = request.body
    if (body.title === undefined
      || body.author === undefined
      || body.url === undefined) {
      return response.status(400).json({ error: 'invalid blog content' })
    }

    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(Blog.format(blog))
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({ error: exception.message })
    } else {
      console.log(exception)
      response.status(500).json({ error: 'internal error' })
    }
  }
})


blogsRouter.put('/:id', async (request, response) => {
  try {
    const decodedToken = jwt.verify(request.token, process.env.SECRET)

    if (!request.token || !decodedToken.id) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }
    const body = request.body
    if (body.title === undefined
      || body.url === undefined) {
      return response.status(400).json({ error: 'invalid blog content' })
    }

    const savedBlog = await Blog.findById(request.params.id)
    if (!savedBlog) {
      return response.status(404).json({ error: 'blog not found' })
    }
    savedBlog.title = body.title
    savedBlog.url = body.url
    savedBlog.likes = body.likes

    const updatedBlog = await savedBlog.save()

    response.status(200).json(Blog.format(updatedBlog))
  } catch (exception) {
    if (exception.name === 'JsonWebTokenError') {
      response.status(401).json({ error: exception.message })
    } else {
      console.log(exception)
      response.status(500).json({ error: 'internal error' })
    }
  }
})


blogsRouter.delete('/:id', async (request, response) => {
  try {
    if (!request.token) {
      return response.status(401).json({ error: 'token missing' })
    }
    const decodedToken = jwt.verify(request.token, process.env.SECRET)
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const blog = await Blog.findById(request.params.id)
    if (!blog) {
      return response.status(404).json({ error: 'blog not found' })
    }
    if (blog.user && (blog.user.toString() !== decodedToken.id)) {
      return response.status(403).json({ error: 'not allowed to delete other users\' entries' })
    }

    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } catch (exception) {
    console.log(exception)
    response.status(400).json({ error: 'bad id' })
  }
})

module.exports = blogsRouter