import React, { useState } from 'react'
import { useNuiEvent } from '../../utils/useNuiHook'
import { useStopwatch } from 'react-timer-hook'
import { useStopWatch } from '../../utils/useStopwatch'

function Digit({ value }: { value: number }) {
  const leftDigit = value >= 10 ? value.toString()[0] : '0'
  const rightDigit = value >= 10 ? value.toString()[1] : value.toString()

  return (
    <span>
      {leftDigit}
      {rightDigit}
    </span>
  )
}

const RaceStats = () => {
  const [currCheckpoint, setCurrCheckpoint] = useState(0)
  const [totalCheckpoints, setTotalCheckpoints] = useState(0)
  const [laps, setLaps] = useState<boolean | number>(false)
  const [currentLap, setCurrentLap] = useState<number>(0)
  const [finished, setFinished] = useState<boolean>(false)
  const [finalTimeMs, setFinalTimeMs] = useState<number>(0)
  // const { seconds, minutes, hours, start, reset, pause } = useStopwatch({
  //   autoStart: false,
  // })

  const {
    time,
    start,
    stop,
    reset,
    lap,
    laps: wLaps,
    currentLapTime,
    slowestLapTime,
    fastestLapTime,
  } = useStopWatch()

  useNuiEvent('raceUpdate', (data) => {
    console.log(data, 'raceUpdate')
    if (data.reset) {
      reset()
    }

    if (data.startTimestamp) {
      reset()
      start()
    }

    if (data.nextCheckpointCount) {
      setCurrCheckpoint(data.nextCheckpointCount)
    }

    if (data.totalCheckpoints) {
      setTotalCheckpoints(data.totalCheckpoints)
    }

    if (data.laps) {
      setLaps(data.laps)
    }

    if (data.currentLap) {
      setCurrentLap(data.currentLap)
      if (data.currentLap !== 0) {
        console.log('lappi')
        lap()
      }
    }

    if (data.finished) {
      setFinished(data.finished)
    }

    if (data.finalTimeMs) {
      if (data.finalTimeMs == 0) return

      stop()
      setFinalTimeMs(data.finalTimeMs)
    }
  })

  return (
    <div className='grid align-items h-screen place-content-end p-4 text-white'>
      <div className='bg-slate-700/75 p-6 rounded-md'>
        <div className='flex flex-col'>
          <h1>Reissi</h1>

          {finished && <h1>Ok läpäisit tän hei {finalTimeMs}</h1>}

          <span>{time}</span>

          {!finished && (
            <span>
              {Number(currCheckpoint)}/{totalCheckpoints}
            </span>
          )}

          {laps && (
            <>
              {!finished && (
                <span>
                  Kierros {currentLap}/{laps}
                </span>
              )}

              <span>Nopein kierros {fastestLapTime}</span>

              <span>Hitain kierros {slowestLapTime}</span>

              <span>Tämä kierros {currentLapTime}</span>

              {wLaps.map((lap) => (
                <span>
                  {lap.time} - {lap.lap}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RaceStats
