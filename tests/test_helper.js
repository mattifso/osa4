const User = require('../models/user')
const Blog = require('../models/blog')

const usersInDb = async () => {
  const users = await User.find({})
  return users
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs
}

module.exports = {
  usersInDb,
  blogsInDb
}