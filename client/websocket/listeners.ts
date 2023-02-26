import { Store } from '@reduxjs/toolkit'
import SimplePeer from 'simple-peer'
import { RootState, store } from '../store'
import { setPlayer } from '../store/slices/boardSlice'
import { addPeer } from '../store/slices/peerSlice'
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
    console.log('%c Peer: peer connected', 'color: #cc96f9')
    peer.send(`{ "type": "info", "payload": "Hello from peer ${socket.id}" }`)

    Object.entries(store.getState().peer.peers)
      .filter(([, peer]) => peer.connected)
      .forEach(([id, peer]) => {
        console.log('%c Peer: Sending position to peer ' + id, 'color: #cc96f9')
        const message: PeerMessage = {
          type: 'request:player',
          from: socket.id,
          payload: {}
        }
        peer.send(JSON.stringify(message))
      })
  })

  peer.on('data', data => {
    const json = JSON.parse(data.toString()) as PeerMessage
    console.group(`%c Peer: data received [${json.type}]`, 'color: #cc96f9')
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
      case 'request:player':
        payload = {
          type: 'player:setAvatar',
          from: socket.id,
          payload: {
            avatar: store.getState().board.playerAvatar,
            position: store.getState().board.playerPosition
          }
        }
        store.getState().peer.peers[json.from].send(JSON.stringify(payload))
        break
      default:
        console.error('Unknown message type')
        break
    }
    console.groupEnd()
  })

  peer.on('stream', stream => {
    console.log('%c Peer: stream received', 'color: #cc96f9', stream)
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
    console.log('%c Peer: signal:offer via Socket.io', 'color: #cc96f9', signal)
    socket.emit('signal:offer', {
      signal,
      to: params.userToSignal,
      from: params.callerId
    })
  })

  return peer
}

export const initOnFetchPeers = (store: Store<RootState>): void => {
  socket.on('fetch peers', (payload: { peerIds: string[] }) => {
    console.log('%c Socket: on fetch peers', 'color: #4ebd84', payload)
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

  socket.on('receiving answer', (payload: { signal: SimplePeer.SignalData, from: string }) => {
    console.log('%c Socket: receiving answer', 'color: #4ebd84', payload)
    const { signal, from } = payload
    const distantPeer = store.getState().peer.peers[from]
    if (distantPeer) distantPeer.signal(signal) // Accept the signal
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
    console.log('%c Peer: signal:answer', 'color: #cc96f9', signal)
    socket.emit('signal:answer', {
      signal,
      to: params.from
    })
  })

  return peer
}

export const initOnReceivingOffer = (store: Store<RootState>): void => {
  socket.on('receiving offer', (payload: { from: string, signal: SimplePeer.SignalData }) => {
    console.log('%c Socket: receiving offer', 'color: #4ebd84', payload)
    const { from, signal } = payload

    let peer: SimplePeer.Instance
    // Since trickle is true, this event is triggered multiple times
    // (1 offer, 1 answer and 2 candidate signals in each direction)
    // Thus, we need to check the type of the signal
    if (signal.type === 'offer') {

      // create a connection to the new peer
      peer = onReceivingOffer({ from, signal })

      // add the peer to the store
      store.dispatch(addPeer({ id: from, peer }))
    }
    else if (signal.type === 'candidate') {
      console.log('state', store.getState())
      peer = store.getState().peer.peers[from]
    }
    else {
      console.error('Unknown signal type')
      return
    }

    // Accept incoming signal
    peer.signal(signal)

  })
}

export default {
  initOnReceivingOffer,
  initOnFetchPeers
}
