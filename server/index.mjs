import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'
import { createServer } from 'http'

const app = express()
const port = process.env.PORT || 3000

const server = createServer(app)
const io = new Server(server)

const filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(filename)

const DIST_DIR = path.join(__dirname, '../dist')
const HTML_FILE = path.join(DIST_DIR, 'index.html')

const mockResponse = {
  foo: 'bar',
  bar: 'foo'
}

app.get('/api', (req, res) => {
  res.send(mockResponse)
})

app.get('/', (req, res) => {
  res.sendFile(HTML_FILE)
})

app.use(express.static(DIST_DIR))

io.on('connection', (socket) => {
  console.log('a user connected')

  const allSocketIds = Array.from(io.sockets.sockets.keys())

  console.log('Sockets connected: ', allSocketIds.length)
  socket.emit('fetch peers', {
    peerIds: allSocketIds.filter(id => id !== socket.id)
  })

  socket.on('signal:offer', payload => {
    io.to(payload.to).emit('receiving offer', { signal: payload.signal, from: payload.from })
  })

  socket.on('signal:answer', payload => {
    io.to(payload.to).emit('receiving answer', { signal: payload.signal, from: socket.id })
  })

  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(port, function () {
  console.log('App listening on port: ' + port)
})
