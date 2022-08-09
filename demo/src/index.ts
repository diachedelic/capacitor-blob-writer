import {Filesystem,Directory} from '@capacitor/filesystem'
import {Capacitor} from '@capacitor/core'
import write_blob from 'capacitor-blob-writer'

const output = document.createElement('pre')
document.body.innerHTML = ''
document.body.appendChild(output)

function log (msg: string) {
    output.innerHTML += `${msg}\n`
    console.log(msg)
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    return window.btoa(
        String.fromCharCode(...new Uint8Array(buffer))
    )
}

async function compareBlobs(...blobs: Blob[]) {
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

// make a blob of random binary data, takes a while
function makeRandomBlob(byteLength: number) {
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

// makes a blob of uniform data, faster than makeRandomBlob
function makeUniformBlob(byteLength: number) {
    let blob = new Blob([])

    // avoid running out of memory by gradually increasing the size of the blob,
    // which can flush to disk
    const maxChunkSize = 10 * 1024 * 1024
    let position = 0
    while (position < byteLength) {
        const size = Math.min(maxChunkSize, byteLength - position)
        const bytes = new Uint8Array(size)

        blob = new Blob([blob, bytes.buffer], {
            type: 'application/octet-stream'
        })

        position += maxChunkSize
    }

    if (blob.size !== byteLength) {
        throw new Error('length mismatch')
    }

    return blob
}

async function resolveUri({
    path,
    directory = Directory.Data
}: {path: string, directory: Directory}) {
    if (Capacitor.getPlatform() == "web") {
        const result = await Filesystem.readFile({ path, directory })
        return URL.createObjectURL(result.data as any as Blob)
    }

    const { uri } = await Filesystem.getUri({ path, directory })
    return Capacitor.convertFileSrc(uri)
}

async function testWrite({
    path = `${Math.random()}.bin`,
    blob = makeRandomBlob(10),
    directory = Directory.Data,
    recursive = false,
}) {
    // write
    const start = Date.now()
    let fallbackError
    await write_blob({
        path,
        directory,
        blob,
        fast_mode: true,
        recursive,
        on_fallback(error: any) {
            console.log(error.name, error.message);
            fallbackError = error
        }
    })

    if (fallbackError !== undefined) {
        throw fallbackError
    }

    log(`wrote ${blob.size} bytes in ${Date.now() - start}ms`)

    // read
    const fileURL = await resolveUri({ path, directory })
    const fileResponse = await fetch(fileURL)

    if (fileResponse.status === 404) {
        throw new Error('File not found')
    } else if (fileResponse.status !== 200) {
        throw new Error('bad status')
    }

    const fileBlob = await fileResponse.blob()

    // compare
    await compareBlobs(blob, fileBlob)
    // avoid memory leaks
    URL.revokeObjectURL(fileURL);
}

async function runTests() {
    log('starting tests')

    // non-existant file
    const now = Date.now()
    await testWrite({ path: `${now}.txt` })

    // overwrite file
    await testWrite({ path: `${now}.txt` })

    // no file extension
    await testWrite({ path: `${now}` })

    // deeply nested file
    await testWrite({
        path: `foo/${now}/${now}/${now}.txt`,
        recursive: true,
    })

    // recursive but no parent directory
    await testWrite({
        path: `${now}-root.txt`,
        recursive: true,
    })

    // alternate directory
    await testWrite({ directory: Directory.External })

    // write multiple files concurrently
    await Promise.all([
        testWrite({}),
        testWrite({}),
        testWrite({}),
    ])

    // write larger file to force multiple chunks e.g. when streaming to disk
    await testWrite({ blob: makeRandomBlob(5 * 1024 * 1024) })

    log('tests passed!')
}

async function runBenchmark() {
    log('starting benchmark')

    for (const plugin of ['BlobWriter', 'Filesystem']) {
        const maxSize = 256 * 1024 * 1024

        let byteLength = 1

        while (byteLength <= maxSize) {
            const blob = makeUniformBlob(byteLength)

            const start = Date.now()
            const path = `${Math.random()}.bin`
            const directory = Directory.Data

            if (plugin === 'Filesystem') {
                // read blob as array buffer
                const buffer = await new Response(blob).arrayBuffer()

                await Filesystem.writeFile({
                    path,
                    directory,
                    data: arrayBufferToBase64(buffer),
                })
            } else if (plugin === 'BlobWriter') {
                await write_blob({
                    path,
                    directory,
                    blob,
                    fast_mode: true
                })
            }

            log(`${plugin} wrote ${byteLength} in ${Date.now() - start}ms`)

            // exponentially increase data size
            byteLength *= 2
        }
    }

    log('benchmark finished')
}

async function runAll() {
    await runTests()

    // benchmarks generally cause a crash, disable until required :)
    const iWantACrash = false
    if (iWantACrash) {
        await runBenchmark()
    }
}

runAll().catch(err => {
    console.error(err)
    log(err.message)
    log(err.stack)
})
