import { FilesystemDirectory, Capacitor } from '@capacitor/core';

// import directly, instead of using Capacitor.Plugins
// see https://capacitor.ionicframework.com/docs/plugins/js/
import { writeFile } from '../../dist/plugin.mjs'

const output = document.createElement('pre')
document.body.innerHTML = ''
document.body.appendChild(output)

function log (msg) {
  output.innerHTML += `${msg}\n`
}

async function compareBlobs(...blobs) {
  const buffers = await Promise.all(
    blobs.map(
      // read blobs as ArrayBuffers
      blob => new Response(blob).arrayBuffer()
    )
  )

  const views = buffers.map(buffer => new DataView(buffer))

  views.reduce((a, b) => {
    if (a.byteLength !== b.byteLength) {
      throw new Error('buffer lengths differ')
    }

    for (let i = 0; i < a.byteLength; i++) {
      if (a.getInt8(i) !== b.getInt8(i)) {
        throw new Error('buffers differ')
      }
    }

    return b
  })
}

// make a blob of random binary data
function makeBlob(byteLength) {
  const buffer = new ArrayBuffer(byteLength)
  const view = new DataView(buffer)
  let position = 0

  while(position < buffer.byteLength) {
    const val = Math.floor(256 * Math.random())
    view.setInt8(position, val)
    position += 1
  }

  return new Blob([buffer], { type: 'application/octet-stream' })
}

async function testWrite({
  path = `/${Math.random()}.bin`,
  blob = makeBlob(10),
  directory = FilesystemDirectory.Data,
}) {
  // write
  const start = Date.now()
  const { uri } = await writeFile({ path, directory, data: blob })
  log(`wrote ${blob.size} bytes in ${Date.now() - start}ms`)

  // read
  const fileURL = Capacitor.convertFileSrc(uri)
  const fileResponse = await fetch(fileURL)

  const fileBlob = await fileResponse.blob()

  // compare
  await compareBlobs(blob, fileBlob)
}

async function run() {
  // non-existant file
  const now = Date.now()
  await testWrite({ path: `/${now}.txt` })

  // overwrite file
  await testWrite({ path: `/${now}.txt` })

  // edge cases with chunk sizes when writing to disk
  const chunkSize = 1024
  await testWrite({ blob: makeBlob(chunkSize) })
  await testWrite({ blob: makeBlob(chunkSize - 1) })
  await testWrite({ blob: makeBlob(chunkSize + 1) })

  // alternate directory
  await testWrite({ directory: FilesystemDirectory.Cache })

  // write multiple files concurrently
  await Promise.all([
    testWrite({}),
    testWrite({}),
    testWrite({}),
  ])

  // write same file concurrently
  try {
    await Promise.all([
      testWrite({ path: '/concurrent.bin' }),
      testWrite({ path: '/concurrent.bin' }),
    ])
  } catch (err) {
    if (err.message !== 'buffers differ') {
      throw err
    }
  }

  // write large file
  await testWrite({ blob: makeBlob(20 * 1024 * 1024) })

  log('tests passed!')
}

run().catch(err => {
  console.error(err)
  log(err.message)
})
