// This file will be ran in a seperate thread to keep the bot responsive
const { isMainThread, parentPort, workerData } = require('worker_threads')

if (isMainThread) {
  throw 'Please do not start the parser directly, this shall be started as a worker thread!'
  process.exit()
}

console.log('Message parser thread running')

const swearJar = require('swearjar')
const path = require('path')
swearJar.loadBadWords('swearfile.json')
/*
const swearJarCategories = [
  'blasphemy',
  'discriminatory',
  'inappropriate',
  'insult',
  'sexual',
]
*/

parentPort.on('message', (rawData) => {
  const data = JSON.parse(rawData)

  const msgInappropiate = swearJar.profane(data.content.split('_').join(' '))
  if (!msgInappropiate) return

  const rawCategories = swearJar.scorecard(data.content)
  const categories = Object.keys(rawCategories).filter(
    (x) => rawCategories[x] == 1
  )

  parentPort.postMessage(JSON.stringify({ categories, ...data }))
})
