// This file will be ran in a seperate thread to keep the bot responsive
const { isMainThread, parentPort, workerData } = require('worker_threads')

if (isMainThread) {
  throw 'Please do not start the database handler directly, this shall be started as a worker thread!'
  process.exit()
}

console.log('Database handler thread running')

// first message = DB config
parentPort.once('message', (config) => {
  const DATABASE = JSON.parse(config)

  const knex = require('knex')({
    client: 'mysql',
    connection: DATABASE.URI,
    debug: DATABASE.DEBUG || false,
  })

  parentPort.on('message', (rawData) => {
    const data = JSON.parse(rawData)

    knex(DATABASE.table)
      .insert(data)
      .catch((err) => {
        parentPort.postMessage(JSON.stringify({ ...err }))
      })
  })
})
