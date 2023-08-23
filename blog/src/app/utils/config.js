require('dotenv').config()

const PORT = process.env.PORT || 5000
const DATABASE_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URI
  : process.env.DATABASE_URI

module.exports = {
  DATABASE_URI,
  PORT
}