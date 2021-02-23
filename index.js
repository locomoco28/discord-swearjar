const Discord = require('discord.js')
const client = new Discord.Client()

const { DISCORD, DATABASE } = require('./config.json')

const path = require('path')
const { Worker } = require('worker_threads')

const parseWorker = new Worker(
  path.join(__dirname, 'parsing_thread', 'parse.js')
)
const dbWorker = new Worker(path.join(__dirname, 'db_push_thread', 'db.js'))
dbWorker.postMessage(JSON.stringify(DATABASE))
dbWorker.on('message', (error) => {
  console.error('DB Error: %o', { err: JSON.parse(error) })
})

client.once('ready', () => {
  console.log('Ready!')
})

client.on('error', console.error)

client.on('message', (message) => {
  const { content, channel, id } = message

  parseWorker.postMessage(
    JSON.stringify({
      content,
      ...{
        channel_id: channel.id,
        message_id: id,
        isEdit: false,
        type: channel.type,
        server_id:
          channel.type == 'dm'
            ? 'DM'
            : 'guild' in message
            ? message.guild.id
            : 'UNKNOWN CHANNEL',
      },
    })
  )
})

client.on('messageUpdate', (oldMessage, newMessage) => {
  const { content, channel, id, guild } = newMessage

  parseWorker.postMessage(
    JSON.stringify({
      content,
      ...{
        channel_id: channel.id,
        message_id: id,
        isEdit: true,
        type: channel.type,
        server_id: guild.id,
      },
    })
  )
})

parseWorker.on('message', (data) => {
  const {
    content,
    type,
    categories,
    channel_id,
    message_id,
    isEdit,
    server_id,
  } = JSON.parse(data)

  client.channels.fetch(channel_id).then((ch) => {
    ch.messages.fetch(message_id).then((msg) => {
      dbWorker.postMessage(
        JSON.stringify({
          author_tag: msg.author.tag,
          author_id: msg.author.id,
          message_content: content,
          categories: categories.join(','),
          channel_id,
          message_id,
          isEdit,
          channel_type: type,
          timestamp: msg.createdAt.toISOString(),
          server_id,
        })
      )

      msg.react(isEdit ? '😡' : '😠')
    })
  })
})

client.login(DISCORD.BOT_TOKEN)
