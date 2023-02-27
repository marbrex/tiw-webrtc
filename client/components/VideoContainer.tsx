/* eslint-disable no-return-assign */
import React, { useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { setLocalStream } from '../store/slices/videoSlice'
import socket from '../websocket'
import VideoFrame from './VideoFrame'

const VideoContainer: React.FC = () => {

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const dispatch = useAppDispatch()

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
          dispatch(setLocalStream(stream))
        }
      })
      .catch(err => {
        console.error(err)
      })
  }, [])

  const peers = useAppSelector(state => state.video.peers)
  const remoteVideoRef = useRef<{
    [peerId: string]: HTMLVideoElement
  }>({})

  React.useEffect(() => {
    Object.keys(peers).forEach(id => {
      const stream = peers[id]
      if (remoteVideoRef.current[id]) {
        remoteVideoRef.current[id].srcObject = stream
      }
    })
  }, [peers])

  return (
    <div id='video-container'>
      <VideoFrame id={socket.id} local ref={localVideoRef} />
      {
        Object.keys(peers).map(id => {
          return <>
            <VideoFrame
              id={id}
              ref={r => remoteVideoRef.current[id] = r}
            />
          </>
        })
      }
    </div>
  )
}

export default VideoContainer
