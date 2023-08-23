const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((acc, blog) => acc + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  return blogs.reduce((favorite, current) => current.likes > favorite.likes ? current : favorite)
}

const mostBlogs = (blogs) => {
  const authors = {}

  blogs.forEach(blog => {
    authors[blog.author] === undefined ? authors[blog.author] = 1 : authors[blog.author] += 1
  })

  const author = Object.keys(authors).reduce((a, b) => authors[a] > authors[b] ? a : b)

  return { author: author, blogs: authors[author] }
}

const mostLikes = (blogs) => {
  const authors = {}

  blogs.forEach(blog => {
    authors[blog.author] === undefined ? authors[blog.author] = blog.likes : authors[blog.author] += blog.likes
  })

  const author = Object.keys(authors).reduce((a, b) => authors[a] > authors[b] ? a : b)

  return { author: author, likes: authors[author] }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}