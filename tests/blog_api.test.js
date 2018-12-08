const supertest = require('supertest')
const { app, server } = require('../index')
const api = supertest(app)
const Blog = require('../models/blog')
const User = require('../models/user')
const { usersInDb, blogsInDb } = require('./test_helper')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0
  },
  {
    _id: '5a422b891b54a676234d17fa',
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
    __v: 0
  },
  {
    _id: '5a422ba71b54a676234d17fb',
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    __v: 0
  },
  {
    _id: '5a422bc61b54a676234d17fc',
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    __v: 0
  }
]

describe('in the response to a GET to /api/blogs', () => {

  beforeAll(async () => {
    await Blog.remove({})
    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('the blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('we see there are six blogs', async () => {
    const response = await api
      .get('/api/blogs')

    expect(response.body.length).toBe(initialBlogs.length)
  })

  test('the first blog is about React patterns', async () => {
    const response = await api
      .get('/api/blogs')

    expect(response.body[0].title).toBe('React patterns')
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api
      .get('/api/blogs')

    expect(response.body.map(r => r.url)).toContain('http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html')
  })

})

const newBlog = {
  title: 'Most Interesting Blog in the World',
  author: 'Foo Bar',
  url: 'https://localhost.com',
  likes: 42,
}

describe('after a POST to /api/blogs', () => {

  let token
  beforeEach(async () => {
    await Blog.remove({})
    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
    await User.remove({})
    const passwordHash = await bcrypt.hash('pass', 10)
    const user = new User({ username: 'user', password: 'pass', passwordHash: passwordHash })
    await user.save()
    const userForToken = {
      username: user.username,
      id: user._id
    }
    token = jwt.sign(userForToken, process.env.SECRET)
  })

  test('the DB includes the new blog', async () => {
    const blogsBeforeAdding = await blogsInDb()
    expect(blogsBeforeAdding.filter(r => r.title === 'Most Interesting Blog in the World')).toBeUndefined
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    const blogsAfterAdding = await blogsInDb()
    const newBlogInDb = blogsAfterAdding.filter(r => r.title === 'Most Interesting Blog in the World')
    expect(newBlogInDb[0].author).toEqual('Foo Bar')
    expect(newBlogInDb[0].url).toEqual('https://localhost.com')
    expect(newBlogInDb[0].likes).toEqual(42)
    expect(blogsAfterAdding.length).toEqual(blogsBeforeAdding.length + 1)
  })


  test('the response to GET /api/blogs includes the new blog', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api
      .get('/api/blogs')

    const returnedNewBlog = response.body.filter(r => r.title === 'Most Interesting Blog in the World')
    expect(returnedNewBlog.length).toEqual(1)
    expect(returnedNewBlog[0].author).toEqual('Foo Bar')
    expect(returnedNewBlog[0].url).toEqual('https://localhost.com')
    expect(returnedNewBlog[0].likes).toEqual(42)
  })

  test('in the response to the response to GET /api/blogs, the amount of blogs has increased by one', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const response = await api
      .get('/api/blogs')

    expect(response.body.length).toBe(initialBlogs.length + 1)
  })

  test('if the new blog in the request didn\'t have title and url set, response is 400', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(
        {
          author: 'Foo Bar',
          likes: 42,
          url: 'www.foobar.com'
        }
      )
      .expect(400)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        author: 'Foo Bar',
        likes: 42,
        title: 'Yada Yada'
      })
      .expect(400)
      .expect('Content-Type', /application\/json/)
  })

  test('if the new blog in the request didn\'t define likes, they are set to 0', async () => {
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(
        {
          author: 'Foo Bar',
          url: 'www.foobar.com',
          title: 'Yada Yada'
        }
      )
      .expect(201)
      .expect('Content-Type', /application\/json/)
    const response = await api
      .get('/api/blogs')

    const returnedNewBlog = response.body.filter(r => r.title === 'Yada Yada')[0]
    expect(returnedNewBlog.author).toEqual('Foo Bar')
    expect(returnedNewBlog.likes).toEqual(0)
  })

})

describe('when there is initially one user at db', async () => {
  beforeAll(async () => {
    await User.remove({})
    const user = new User({ username: 'root', password: 'sekret' })
    await user.save()
  })

  test('POST /api/users succeeds with a fresh username', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAfterOperation = await usersInDb()
    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length + 1)
    const usernames = usersAfterOperation.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('POST /api/users fails with proper statuscode and message if username already taken', async () => {
    const usersBeforeOperation = await usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body).toEqual({ error: 'username must be unique' })

    const usersAfterOperation = await usersInDb()
    expect(usersAfterOperation.length).toBe(usersBeforeOperation.length)
  })
})

afterAll(() => {
  server.close()
})