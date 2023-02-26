import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface VideoState {
  stream: MediaStream
  peers: {
    [peerId: string]: MediaStream
  }
}

const initialState: VideoState = {
  stream: null,
  peers: {}
}

export const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    setLocalStream: (state, action: PayloadAction<MediaStream>) => {
      state.stream = action.payload
    },
    setRemoteStream: (state, action: PayloadAction<RemoteStreamProps>) => {
      const { peerId, stream } = action.payload
      state.peers[peerId] = stream
    },
    removeRemoteStream: (state, action: PayloadAction<string>) => {
      const peerId = action.payload
      delete state.peers[peerId]
    }
  }
})

interface RemoteStreamProps {
  peerId: string,
  stream: MediaStream
}

export const { setLocalStream, setRemoteStream } = videoSlice.actions
export default videoSlice.reducer
