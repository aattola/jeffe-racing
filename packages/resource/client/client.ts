import { ClientUtils, RegisterNuiCB } from '@project-error/pe-utils'
import { Wait } from './utils/Wait'

const rpc = new ClientUtils()

interface Point {
  x: number
  y: number
  z: number
  index: number
  checkpoint?: number
}

interface Track {
  name: string
  desc: string
  creator: string
  id: number
  points: Point[]
  laps: boolean | number
}

const config = {
  checkpoint: {
    diameter: 7,
  },
}

const demoTrack: Track = {
  name: 'Military GRAND PRIX',
  desc: 'Tollasta',
  creator: 'JEFFe',
  id: 1231232,
  laps: false,
  points: [
    {
      x: -2214.084228515625,
      y: 3236.9580078125,
      z: 32.81017303466797,
      index: 0,
    },
    {
      x: -2070.4443359375,
      y: 3149.971435546875,
      z: 32.81025314331055,
      index: 1,
    },
    {
      x: -2069.555908203125,
      y: 3069.772216796875,
      z: 32.80978012084961,
      index: 2,
    },
    {
      x: -2243.842041015625,
      y: 3156.057373046875,
      z: 32.8099365234375,
      index: 3,
    },
  ],
}

function updateRace(data: any) {
  SendNUIMessage({
    action: 'raceUpdate',
    data,
  })
}

// const nextPoint: Point = {
//   x: -2069.555908203125,
//   y: 3069.772216796875,
//   z: 32.80978012084961,
//   index: 2,
// }

let currentPointCount = 0
let currentLap = 0
let raceStartedTimestamp: number

interface RenderedPoint {
  [key: number]: Point
}

const renderedPoints: RenderedPoint = {}

const currentTrack: Track = demoTrack

const gameTick = setTick(async () => {
  // await Wait(1)

  const ped = GetPlayerPed(-1)
  const [playerX, playerY, playerZ] = GetEntityCoords(ped)

  if (currentPointCount === currentTrack.points.length) {
    currentPointCount = 0
  }

  const currentPoint = currentTrack.points[currentPointCount]
  const distance = GetDistanceBetweenCoords(
    playerX,
    playerY,
    playerZ,
    currentPoint.x,
    currentPoint.y,
    0,
    false,
  )

  const radius = config.checkpoint.diameter

  if (radius >= distance) {
    if (currentPoint.checkpoint) {
      DeleteCheckpoint(currentPoint.checkpoint)
      renderedPoints[currentPoint.index] = null

      const nextIndex = currentPointCount === currentTrack.points.length ? 0 : currentPointCount + 1

      if (nextIndex == currentTrack.points.length) {
        // uusi kierros alkoi juuri / loppui koko roska
        if (!currentTrack.laps) return finishGame()

        if (currentTrack.laps === currentLap) return finishGame()
        // jatkuu
        currentLap = currentLap + 1
        updateRace({ currentLap: currentLap })
      }

      const nextIndexRender = currentTrack.points[currentPointCount + 1] ? currentPointCount + 1 : 0

      renderNext(nextIndexRender, currentTrack)
      currentPointCount = nextIndex
      PlaySoundFrontend(-1, 'RACE_PLACED', 'HUD_AWARDS', true)
      updateRace({ nextCheckpointCount: nextIndex })
    }
  }
})

function finishGame() {
  clearTick(gameTick)
  console.log('peli done')
  PlaySoundFrontend(-1, 'ScreenFlash', 'WastedSounds', true)

  updateRace({
    finished: true,
    finalTimeMs: Date.now() - raceStartedTimestamp,
  })
}

function renderNext(pointIndex: number, track: Track) {
  const { x, y, z } = track.points[pointIndex]

  let checkpoint: number
  if (pointIndex === track.points.length - 1) {
    const { x: x1, y: y1, z: z1 } = track.points[0]
    checkpoint = CreateCheckpoint(
      7,
      x,
      y,
      z,
      x1,
      y1,
      z1,
      config.checkpoint.diameter,
      93,
      182,
      229,
      255,
      0,
    )
  } else {
    const { x: x1, y: y1, z: z1 } = track.points[pointIndex + 1]
    checkpoint = CreateCheckpoint(
      7,
      x,
      y,
      z,
      x1,
      y1,
      z1,
      config.checkpoint.diameter,
      93,
      182,
      229,
      255,
      0,
    )
  }

  track.points[pointIndex].checkpoint = checkpoint
}

function setupTrack(track: Track) {
  track.points.forEach((point, index) => {
    const { x, y, z } = point

    let checkpoint: number
    if (index === track.points.length - 1) {
      const { x: x1, y: y1, z: z1 } = track.points[0]
      checkpoint = CreateCheckpoint(
        7,
        x,
        y,
        z,
        x1,
        y1,
        z1,
        config.checkpoint.diameter,
        93,
        182,
        229,
        255,
        0,
      )
    } else {
      const { x: x1, y: y1, z: z1 } = track.points[index + 1]
      checkpoint = CreateCheckpoint(
        7,
        x,
        y,
        z,
        x1,
        y1,
        z1,
        config.checkpoint.diameter,
        93,
        182,
        229,
        255,
        0,
      )
    }

    SetCheckpointCylinderHeight(checkpoint, 10, 10, 25)

    renderedPoints[index] = point
  })
}

RegisterCommand(
  'setuptrack',
  async () => {
    SendNUIMessage({
      action: 'openPage',
      data: {
        pageName: 'closePage',
      },
    })

    await Wait(200)

    SendNUIMessage({
      action: 'openPage',
      data: {
        pageName: 'RaceStats',
      },
    })

    raceStartedTimestamp = Date.now()

    updateRace({
      startTimestamp: raceStartedTimestamp,
      nextCheckpointCount: 0,
      totalCheckpoints: currentTrack.points.length,
      laps: currentTrack.laps,
      currentLap: currentLap,
      finished: false,
      finalTimeMs: 0,
    })

    renderNext(0, currentTrack)
  },
  false,
)

RegisterCommand(
  'getcoords',
  (source: any, args: any, rawCommand: string) => {
    const ped = GetPlayerPed(-1)
    const [playerX, playerY, playerZ] = GetEntityCoords(ped)

    console.log(`${playerX}, ${playerY}, ${playerZ}`)

    SendNUIMessage({
      action: 'sendData',
      data: {
        xyz: { x: playerX, y: playerY, z: playerZ },
      },
    })
  },
  false,
)

RegisterCommand(
  'checkpoint32',
  () => {
    CreateCheckpoint(7, -2154.99, 3194.16, 32.81, -2145.84, 3220.34, 32.81, 7, 93, 182, 229, 255, 0)
  },
  false,
)

RegisterCommand(
  'nuitest',
  () => {
    SendNUIMessage({
      action: 'openPage',
      data: {
        pageName: 'HelloWorld',
      },
    })

    SetNuiFocus(true, true)
  },
  false,
)

RegisterNuiCB('closeMenu', (_, cb) => {
  SetNuiFocus(false, false)
  SendNUIMessage({
    action: 'closePage',
    data: {
      pageName: 'HelloWorld',
    },
  })

  cb(true)
})

RegisterNuiCB('getDemoData', (data, cb) => {
  console.log(data)

  cb({ demo: true, inBrowser: false })
})
