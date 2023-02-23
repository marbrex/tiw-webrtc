import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import SimplePeer from 'simple-peer'

interface PeerState {
  peerId: string
  peers: {
    [peerId: string]: SimplePeer.Instance
  }
}

const initialState: PeerState = {
  peerId: '',
  peers: {}
}

export const peerSlice = createSlice({
  name: 'peer',
  initialState,
  reducers: {
    setPeerId: (state, action: PayloadAction<string>) => {
      state.peerId = action.payload
    },
    addPeer: (state, action: PayloadAction<PayloadAddPeer>) => {
      const { id, peer } = action.payload
      state.peers[id] = peer
    }
  }
})

interface PayloadAddPeer {
  id: string
  peer: SimplePeer.Instance
}

export const { setPeerId, addPeer } = peerSlice.actions

export default peerSlice.reducer
