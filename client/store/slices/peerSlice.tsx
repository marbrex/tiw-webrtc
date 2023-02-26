import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import SimplePeer from 'simple-peer'

interface PeerState {
  peers: {
    [peerId: string]: SimplePeer.Instance
  }
}

const initialState: PeerState = {
  peers: {}
}

export const peerSlice = createSlice({
  name: 'peer',
  initialState,
  reducers: {
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

export const { addPeer } = peerSlice.actions

export default peerSlice.reducer
