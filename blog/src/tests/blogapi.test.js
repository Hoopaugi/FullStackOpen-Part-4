const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const api = supertest(app)

const Blog = require('../app/models/blog')
const User = require('../app/models/user')

let initialUsers = []

beforeEach(async () => {
  initialUsers = []

  await User.deleteMany({})

  for (let user of helper.initialUsers) {
    let passwordHash = await bcrypt.hash(user.password, 10)
    let newUser = new User({ ...user, passwordHash: passwordHash })

    let savedUser = await newUser.save()

    let request = await api
      .post('/api/login')
      .send({ ...user })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(request.body.token).toBeDefined()
    expect(request.body.username).toBe(user.username)

    initialUsers = initialUsers.concat({ ...savedUser.toJSON(), token: request.body.token })
  }

  await Blog.deleteMany({})

  for (let blog of helper.initialBlogs) {
    let newBlog = new Blog({ ...blog, user: initialUsers[0].id })

    await newBlog.save()
  }
})

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const titles = response.body.map(blog => blog.title)

    expect(titles).toContain('TDD harms architecture')
  })
})

describe('viewing a specific blog', () => {
  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(resultBlog.body.title).toEqual(blogToView.title)
    expect(resultBlog.body.author).toEqual(blogToView.author)
    expect(resultBlog.body.url).toEqual(blogToView.url)
  })

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api
      .get(`/api/blogs/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})

describe('addition of a new blog', () => {
  test('succeeds with valid data', async () => {
    const newBlog = {
      title: 'Introducing the React Mega-Tutorial',
      author: 'Miguel Grinberg',
      url: 'https://blog.miguelgrinberg.com/post/introducing-the-react-mega-tutorial',
      likes: 5
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    const titles = blogsAtEnd.map(blog => blog.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain('Introducing the React Mega-Tutorial')
  })

  test('fails without authorizaation', async () => {
    const newBlog = {
      title: 'Introducing the React Mega-Tutorial',
      author: 'Miguel Grinberg',
      url: 'https://blog.miguelgrinberg.com/post/introducing-the-react-mega-tutorial',
      likes: 5
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with missing title', async () => {
    const newBlog = {
      author: 'Miguel Grinberg',
      url: 'https://blog.miguelgrinberg.com/post/introducing-the-react-mega-tutorial',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with missing url', async () => {
    const newBlog = {
      title: 'Introducing the React Mega-Tutorial',
      author: 'Miguel Grinberg',
      likes: 0
    }

    await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .send(newBlog)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('likes default to 0', async () => {
    const newBlog = {
      title: 'Introducing the React Mega-Tutorial',
      author: 'Miguel Grinberg',
      url: 'https://blog.miguelgrinberg.com/post/introducing-the-react-mega-tutorial'
    }

    const request = await api
      .post('/api/blogs')
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(request.body.likes).toBe(0)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with statuscode 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const titles = blogsAtEnd.map(blog => blog.title)

    expect(titles).not.toContain(blogToDelete.title)
  })

  test('fails with invalid authorization', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(401)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails if not owner', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    const result = await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set({ Authorization: `Bearer ${initialUsers[1].token}` })
      .expect(401)


    expect(result.body.error).toContain('not owner')

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('updating a blog', () => {
  test('succeeds if and fields are valid', async () => {
    const blogsAtStart = await helper.blogsInDb()

    const updatedLikes = blogsAtStart[0].likes + 10323
    const blogToUpdate = { ...blogsAtStart[0], likes: updatedLikes }

    const updatedBlog = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set({ Authorization: `Bearer ${initialUsers[0].token}` })
      .send(blogToUpdate)
      .expect(200)

    expect(updatedBlog.body.likes).toBe(updatedLikes)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .put(`/api/blogs/${invalidId}`)
      .expect(400)
  })
})

test('blog identifier is id and not _id', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultBlog.body.id).toBeDefined()
  expect(resultBlog.body._id).not.toBeDefined()
})

afterAll(async () => {
  await mongoose.connection.close()
})