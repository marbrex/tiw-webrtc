import React from 'react'

interface VideoFrameProps {
  id: string
  local?: boolean
}

const VideoFrame = React.forwardRef<HTMLVideoElement, VideoFrameProps>(
  ({ id, local = false }, ref) => {
    return (
      <>
        <video className='video-frame'
          id={id} ref={ref}
          autoPlay playsInline muted={local}
        />
      </>
    )
  }
)

export default VideoFrame
