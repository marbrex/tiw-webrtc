import React from 'react'

interface VideoFrameProps {
  id: string
}

const VideoFrame = React.forwardRef<HTMLVideoElement, VideoFrameProps>(
  ({ id }, ref) => {
    return (
      <>
        <video className='item h-48'
          id={id} ref={ref}
          autoPlay playsInline
        />
      </>
    )
  }
)

export default VideoFrame
