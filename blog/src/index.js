const app = require('./app')
const config = require('./app/utils/config')
const logger = require('./app/utils/logger')

app.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`)
})