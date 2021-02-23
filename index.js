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
  const { content, channel, id, cleanContent } = message

  parseWorker.postMessage(
    JSON.stringify({
      content,
      cleanContent,
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
  const { content, channel, id } = newMessage

  parseWorker.postMessage(
    JSON.stringify({
      content,
      ...{
        channel_id: channel.id,
        message_id: id,
        isEdit: true,
        type: channel.type,
        server_id:
          channel.type == 'dm'
            ? 'DM'
            : 'guild' in newMessage
            ? newMessage.guild.id
            : 'UNKNOWN CHANNEL',
      },
    })
  )
})

parseWorker.on('message', (data) => {
  const { categories, channel_id, message_id, isEdit, server_id } = JSON.parse(
    data
  )

  client.channels.fetch(channel_id).then((ch) => {
    const type = ch.type

    ch.messages.fetch(message_id).then((msg) => {
      const { content } = msg
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
