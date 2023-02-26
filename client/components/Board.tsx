/* eslint-disable no-fallthrough */
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store'
import { movePlayer } from '../store/slices/boardSlice'
import { useAppSelector } from '../store/hooks'
import samplemap from '../img/samplemap_16.png'
import alex from '../img/Alex.png'
import bob from '../img/Bob.png'
import adam from '../img/Adam.png'
import amelia from '../img/Amelia.png'
import { useCallback, useEffect } from 'react'
import { AvatarPicker } from './AvatarPicker'
import VideoContainer from './VideoContainer'

export const Board: React.FC = () => {
  const board = useAppSelector((state) => state.board)
  const playerPosition = useAppSelector(state => state.board.playerPosition)
  const playerAvatar = useAppSelector((state) => state.board.playerAvatar)
  const remotePlayers = useAppSelector(state => state.board.remotePlayers)
  const remotePositions = Object.values(remotePlayers).map(value => {
    return {
      position: value.position[1] * board.board.width + value.position[0],
      avatar: value.avatar
    }
  })

  const dispatch = useDispatch<AppDispatch>()

  const keyDownHandler = useCallback(
    (event) => {
      console.log(event.code)
      console.log(playerPosition)
      let newPosition = playerPosition
      if (event.code === 'ArrowUp') {
        newPosition = [playerPosition[0], (playerPosition[1] - 1) % board.board.width]
      }
      if (event.code === 'ArrowDown') {
        newPosition = [playerPosition[0], (playerPosition[1] + 1) % board.board.width]
      }
      if (event.code === 'ArrowLeft') {
        newPosition = [(playerPosition[0] - 1) % board.board.width, playerPosition[1]]
      }
      if (event.code === 'ArrowRight') {
        newPosition = [(playerPosition[0] + 1) % board.board.width, playerPosition[1]]
      }
      console.log(newPosition)
      dispatch(movePlayer(newPosition))
    },
    [playerPosition]
  )

  const boardStyle = {
    display: 'grid',
    'grid-template-columns': 'repeat(60, 16px)',
    'grid-template-rows': 'repeat(60, 16px)',
    'grid-column-gap': '0px',
    'grid-row-gap': '0px',
    backgroundImage: 'url(' + samplemap + ')',
    'background-repeat': 'no-repeat'
  }

  const cellStyle = {
    width: '16px',
    padding: '0px',
    'text-align': 'center'
  }

  const avatarImg = (name: string) => {
    switch (name) {
      case 'Adam':
        return `${adam}`
        break
      case 'Amelia':
        return `${amelia}`
        break
      case 'Alex':
        return `${alex}`
        break
      case 'Bob':
        return `${bob}`
        break
    }
    return ''
  }

  const displayPlayers = useCallback(() => {
    let i = 0
    const grid = []
    for (i = 0; i < board.board.width * board.board.height; i++) {
      if (i === playerPosition[1] * board.board.width + playerPosition[0]) {
        grid.push(
          <div style={cellStyle} key={i}>
            <img src={avatarImg(playerAvatar)}></img>
          </div>
        )
      } else if (
        remotePositions.filter(peer => peer.position === i).length > 0
      ) {
        remotePositions.filter(peer => peer.position === i).forEach(peer => {
          grid.push(
            <div style={cellStyle} key={i}>
              <img src={avatarImg(peer.avatar)}></img>
            </div>
          )
        })
      } else {
        grid.push(<div style={cellStyle} key={i}></div>)
      }
    }
    return grid
  }, [remotePositions, remotePlayers])

  useEffect(() => {
    window.addEventListener('keydown', keyDownHandler)
    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  }, [keyDownHandler])

  return (
    <div className="flex flex-row space-x-2">
      <div className="flew-grow-0" style={boardStyle}>
        {displayPlayers()}
      </div>
      <div className="flex-grow-0 flex-col space-y-2">
        <AvatarPicker></AvatarPicker>
        <div className="item h-48">Video1 Placeholder</div>
        <div className="item h-48">Video2 Placeholder</div>
        <VideoContainer />
      </div>
    </div>
  )
}
