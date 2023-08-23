const mongoose = require('mongoose')

if (process.argv.length === 2 || process.argv.length > 7) {
  console.log('Usage:\nnode mongo.js <uri> <title> <author> <url> <likes>')
  process.exit(1)
}

const uri = process.argv[2]

if (!uri) {
  console.log('uri is required')
  process.exit(1)
}

mongoose.set('strictQuery',false)
mongoose.connect(uri)

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})

const Blog = mongoose.model('Blog', blogSchema)

if (process.argv.length === 5) {
  console.log('blogs:')
  Blog.find({}).then(blogs => {
    blogs.forEach(blog => {
      console.log(`"${blog.title}" by ${blog.author}, ${blog.likes} likes - ${blog.url}`)
    })
    mongoose.connection.close()
    process.exit(1)
  })
} else {
  const title = process.argv[3]
  const author = process.argv[4]
  const url = process.argv[5]
  const likes = process.argv[6]

  if (!title || !author || !url || !likes) {
    console.log('Title, author, url and likes required')
    process.exit(1)
  }

  const blog = new Blog({
    title: title,
    author: author,
    url: url,
    likes: Number(likes)
  })

  // eslint-disable-next-line no-unused-vars
  blog.save().then(result => {
    console.log(`Added blog "${title}" by ${author}`)
    mongoose.connection.close()
  })
}
