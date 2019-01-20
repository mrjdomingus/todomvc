var Redis = require('ioredis')
var redis = new Redis(6379, 'todo-redis')

const bodyParser = require('body-parser')
const session = require('express-session')
const app = require('express')()
const { Nuxt, Builder } = require('nuxt')

// Body parser, to access req.body
app.use(bodyParser.json())

// Sessions to create req.session
app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000 }
}))

app.get('/api/todos', async function (req, res) {
  let todos = []
  let count = await redis.llen('todos')
  if (count > 0) {
    todos = await redis.lrange('todos', 0, -1)
    todos = todos.map(JSON.parse)
  }

  req.session.todos = todos
  res.json(todos)
})

app.put('/api/todos', async function (req, res) {
  let count = await redis.llen('todos')
  if (count > 0) {
    await redis.del('todos')
  }

  await redis.rpush('todos', ...(req.body.todos.map(JSON.stringify)))

  req.session.todos = req.body.todos
  res.json(req.session.todos)
})

// We instantiate Nuxt.js with the options
const isProd = process.env.NODE_ENV === 'production'
let config = require('./nuxt.config.js')
config.dev = !isProd
const nuxt = new Nuxt(config)
// No build in production
const promise = (isProd ? Promise.resolve() : new Builder(nuxt).build())
promise.then(() => {
  app.use(nuxt.render)
  app.listen(3000)
  console.log('Server is listening on http://localhost:3000')  // eslint-disable-line no-console
})
.catch((error) => {
  console.error(error)  // eslint-disable-line no-console
  process.exit(1)
})
