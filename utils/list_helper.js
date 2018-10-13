const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((prev, current) => {
    return prev + current.likes
  }, 0)
}

module.exports = {
  dummy,
  totalLikes
}