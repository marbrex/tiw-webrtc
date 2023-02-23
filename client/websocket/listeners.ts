import SimplePeer from 'simple-peer'
import { AppDispatch, RootState } from '../store'
import { addPeer } from '../store/slices/peerSlice'
import socket from './index'

interface CreatePeerParams {
  initiator: boolean
  stream?: MediaStream
}

const createPeer = (params: CreatePeerParams): SimplePeer.Instance => {
  return new SimplePeer({
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
}

interface OnAllPeersParams {
  userToSignal: string
  callerId: string
  stream?: MediaStream
}

const onAllPeers = (params: OnAllPeersParams): SimplePeer.Instance => {
  const peer: SimplePeer.Instance = createPeer({
    initiator: true,
    ...(params.stream ? { stream: params.stream } : {})
  })

  // This event is automatically triggered
  // on creation of the peer if initiator is true
  peer.on('signal', signal => {
    socket.emit('sending signal', {
      signal,
      to: params.userToSignal,
      from: params.callerId
    })
  })

  return peer
}

export const initOnAllPeers = (dispatch: AppDispatch): void => {
  socket.on('all peers', (payload: { peerIds: string[] }) => {
    console.log('on all peers', payload)
    const { peerIds } = payload

    // for each peer, create a connection
    peerIds.forEach((id: string) => {
      const peer = onAllPeers({
        userToSignal: id,
        callerId: socket.id
      })

      // add peer to the store
      dispatch(addPeer({ id, peer }))
    })
  })
}

interface OnPeerJoinedParams {
  incomingSignal: SimplePeer.SignalData
  callerId: string
  stream?: MediaStream
}

const onPeerJoined = (params: OnPeerJoinedParams): SimplePeer.Instance => {
  const peer: SimplePeer.Instance = createPeer({
    initiator: false,
    ...(params.stream ? { stream: params.stream } : {})
  })

  peer.on('signal', signal => {
    socket.emit('returning signal', {
      signal,
      to: params.callerId
    })
  })

  // Accept incoming signal
  peer.signal(params.incomingSignal)

  return peer
}

export const initOnPeerJoined = (dispatch: AppDispatch, state: RootState): void => {
  socket.on('peer joined', (payload: { peerId: string, signal: SimplePeer.SignalData }) => {
    console.log('on peer joined', payload)
    const { peerId, signal } = payload

    // create a connection to the new peer
    const peer: SimplePeer.Instance = onPeerJoined({ callerId: peerId, incomingSignal: signal })

    // add the peer to the store
    dispatch(addPeer({ id: peerId, peer }))
  })

  socket.on('receiving returned signal', (payload: { signal: SimplePeer.SignalData, from: string }) => {
    const { signal, from } = payload
    const distantPeer = state.peer.peers[from]
    if (distantPeer) distantPeer.signal(signal) // Accept the signal
  })
}

export default {
  initOnPeerJoined,
  initOnAllPeers
}
