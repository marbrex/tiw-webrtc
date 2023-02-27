import { Store } from '@reduxjs/toolkit'
import SimplePeer from 'simple-peer'
import { RootState, store } from '../store'
import { removePlayer, setPlayer } from '../store/slices/boardSlice'
import { addPeer, removePeer } from '../store/slices/peerSlice'
import { removeRemoteStream, setRemoteStream } from '../store/slices/videoSlice'
import socket from './index'

interface CreatePeerParams {
  initiator: boolean
  stream?: MediaStream
}

const createPeer = (params: CreatePeerParams): SimplePeer.Instance => {
  const peer = new SimplePeer({
    initiator: params.initiator,
    ...(params.stream ? { stream: params.stream } : {}),
    trickle: true, // useTrickle doit être a true pour que le peer persiste
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
        // { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
      ]
    }
  })

  peer.on('error', err => {
    console.error('Peer: error', err)
  })

  peer.on('connect', () => {
    console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Connected`, 'color: #cc96f9')
    peer.send(`{ "type": "info", "payload": "Hello from peer ${socket.id}" }`)

    console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Providing player's info to newly connected peer`, 'color: #cc96f9')
    const message: PeerMessage = {
      type: 'player:setAvatar',
      from: socket.id,
      payload: {
        avatar: store.getState().board.playerAvatar,
        position: store.getState().board.playerPosition
      }
    }
    peer.send(JSON.stringify(message))

    // Provide stream to the distant peer
    // There is another code in the middleware that does the same thing
    // But this one is needed because the Redux action might be called before the peer is connected
    // and hence the stream would not be provided to the distant peer
    if (store.getState().video.stream) {
      console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Providing stream to newly connected peer`, 'color: #cc96f9')
      const stream = store.getState().video.stream.clone()
      peer.addStream(stream)
    }
  })

  peer.on('data', data => {
    const json = JSON.parse(data.toString()) as PeerMessage
    console.group(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Data received "${json.type}"`, 'color: #cc96f9')
    let payload
    switch (json.type) {
      case 'info':
        payload = json.payload as string // text message
        console.log(payload)
        break
      case 'player:setAvatar':
        payload = json.payload as { avatar: string, position: [number, number] }
        store.dispatch(setPlayer({ peerId: json.from, avatar: payload.avatar, position: payload.position }))
        break
      case 'player:movePlayer':
        payload = json.payload as [number, number] // position of the player
        store.dispatch(setPlayer({ peerId: json.from, position: payload }))
        break
      default:
        console.error('Unknown message type')
        break
    }
    console.groupEnd()
  })

  peer.on('stream', stream => {
    console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Stream received`, 'color: #cc96f9', stream)

    const peers = store.getState().peer.peers
    const id = Object.keys(peers).find(k => peers[k] === peer)
    if (id) {
      console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Adding stream of ${id}`, 'color: #cc96f9')
      store.dispatch(setRemoteStream({ peerId: id, stream }))
    }
  })

  peer.on('close', () => {
    console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Connection closed`, 'color: #cc96f9')

    const peers = store.getState().peer.peers
    const id = Object.keys(peers).find(k => peers[k] === peer)
    if (id) {
      console.log(`%c [Peer]${params.initiator ? ' Initiator:' : ''} Removing peer from the store ${id}`, 'color: #cc96f9')
      store.dispatch(removePeer(id))
      store.dispatch(removePlayer(id))
      store.dispatch(removeRemoteStream(id))
    }
  })

  return peer
}

interface OnFetchPeersParams {
  userToSignal: string
  callerId: string
  stream?: MediaStream
}

const onFetchPeers = (params: OnFetchPeersParams): SimplePeer.Instance => {
  const peer: SimplePeer.Instance = createPeer({
    initiator: true,
    ...(params.stream ? { stream: params.stream } : {})
  })

  // This event is automatically triggered
  // on creation of the peer if initiator is true
  peer.on('signal', signal => {
    console.log(`%c [Peer] Initiator: sending "${signal.type}" via Socket.io`, 'color: #cc96f9', signal)

    socket.emit(`signal:${signal.type}`, {
      signal,
      to: params.userToSignal,
      from: params.callerId
    })
  })

  return peer
}

export const initOnFetchPeers = (store: Store<RootState>): void => {
  socket.on('fetch', (payload: { peerIds: string[] }) => {
    console.log(`%c [Socket] Received ${payload.peerIds.length} existing peers`, 'color: #4ebd84', payload)
    const { peerIds } = payload

    // for each peer, create a connection
    peerIds.forEach((id: string) => {
      const peer = onFetchPeers({
        userToSignal: id,
        callerId: socket.id
      })

      // add peer to the store
      store.dispatch(addPeer({ id, peer }))
    })
  })
}

interface OnReceivingOfferParams {
  signal: SimplePeer.SignalData
  from: string
  stream?: MediaStream
}

const onReceivingOffer = (params: OnReceivingOfferParams): SimplePeer.Instance => {
  const peer: SimplePeer.Instance = createPeer({
    initiator: false,
    ...(params.stream ? { stream: params.stream } : {})
  })

  peer.on('signal', signal => {
    console.log(`%c [Peer] Sending "${signal.type}" via Socket.io`, 'color: #cc96f9', signal)

    socket.emit(`signal:${signal.type}`, {
      signal,
      to: params.from,
      from: socket.id
    })
  })

  return peer
}

export const initOnReceivingOffer = (store: Store<RootState>): void => {
  socket.on('signal:offer', (payload: { from: string, signal: SimplePeer.SignalData }) => {
    console.log('%c [Socket] Received offer', 'color: #4ebd84', payload)
    const { from, signal } = payload

    // Attention !
    // Have to search for the peer in the store
    // because for any future renegotiation, the peer
    // will already be in the store
    let peer: SimplePeer.Instance

    // => Find the peer in the store
    peer = store.getState().peer.peers[from]

    // If the peer is not in the store
    // (i.e. an unknown peer)
    // => create a new one
    if (!peer) {

      // create a connection to the new peer
      peer = onReceivingOffer({ from, signal })

      // add the peer to the store
      store.dispatch(addPeer({ id: from, peer }))
    }

    // Accept incoming signal
    // And trigger the SimplePeer's "signal" event (on.('signal', ...)
    peer.signal(signal)
  })
}

export const initOnReceivingAnswer = (store: Store<RootState>): void => {
  socket.on('signal:answer', (payload: { signal: SimplePeer.SignalData, from: string }) => {
    console.log('%c [Socket] Received answer', 'color: #4ebd84', payload)
    const { from, signal } = payload

    // Find the peer in the store
    const peer: SimplePeer.Instance = store.getState().peer.peers[from]

    // Accept incoming signal
    // And trigger the SimplePeer's "signal" event (on.('signal', ...)
    if (peer) peer.signal(signal)
    else console.error('Peer not found')
  })
}

export const initOnReceivingCandidate = (store: Store<RootState>): void => {
  socket.on('signal:candidate', (payload: { from: string, signal: SimplePeer.SignalData }) => {
    console.log('%c [Socket] Received candidate', 'color: #4ebd84', payload)
    const { from, signal } = payload

    // Find the peer in the store
    const peer: SimplePeer.Instance = store.getState().peer.peers[from]

    // Accept incoming signal
    // And trigger the SimplePeer's "signal" event (on.('signal', ...)
    if (peer) peer.signal(signal)
    else console.error('Peer not found')
  })
}

const initListeners = (store: Store<RootState>): void => {
  console.log('Initializing listeners...')
  initOnFetchPeers(store)
  initOnReceivingOffer(store)
  initOnReceivingAnswer(store)
  initOnReceivingCandidate(store)
}

export default initListeners
