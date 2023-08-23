const bcrypt = require('bcrypt')
const supertest = require('supertest')
const app = require('../app')
const User = require('../app/models/user')
const helper = require('./test_helper')
const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const initialUser = helper.initialUsers[0]

    const passwordHash = await bcrypt.hash(initialUser.password, 10)
    const user = new User({ ...initialUser, passwordHash: passwordHash })

    await user.save()
  })

  test('login with valid credentials return a token', async () => {
    const credentials = {
      username: 'root',
      password: 'password',
    }

    const request = await api
      .post('/api/login')
      .send(credentials)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(request.body.token).toBeDefined()
    expect(request.body.username).toBe(credentials.username)
  })

  test('fails with status code 401 with invalid credentials', async () => {
    const credentials = {
      username: 'root',
      password: 'passowrd',
    }

    const request = await api
      .post('/api/login')
      .send(credentials)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(request.body.token).not.toBeDefined()
  })
})