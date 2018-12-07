const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((prev, current) => {
    return prev + current.likes
  }, 0)
}

const mostBlogs = (blogs) => {
  const blogCounts = {}
  blogs.forEach(b => {
    if (!blogCounts[b.author]) {
      blogCounts[b.author] = { author: b.author, blogs: 0 }
    }
    blogCounts[b.author].blogs++
  })

  return Object.entries(blogCounts).reduce((prev, current) => {
    if (current[1].blogs > prev.blogs) {
      return current[1]
    } else {
      return prev
    }
  }, { blogs: -1 })
}

module.exports = {
  dummy,
  totalLikes,
  mostBlogs
}