import { useState } from 'react'

import axios from 'axios'


export default function AutoUploaderPrototype() {

  const [videoFile, setVideoFile] = useState(null)

  const [thumbnailFile, setThumbnailFile] = useState(null)

  const [uploading, setUploading] = useState(false)


  const handleUpload = async () => {

    if (!videoFile) {

      alert('Select video first')

      return

    }

    try {

      setUploading(true)

      const formData = new FormData()

      formData.append(
        'title',
        'React Upload Test'
      )

      formData.append(
        'description',
        'Uploaded from React frontend'
      )

      formData.append(
        'visibility',
        'private'
      )

      formData.append(
        'video',
        videoFile
      )

      if (thumbnailFile) {

        formData.append(
          'thumbnail',
          thumbnailFile
        )

      }

      const response = await axios.post(

        'http://127.0.0.1:8000/upload',

        formData,

        {

          headers: {

            'Content-Type':
              'multipart/form-data'

          }

        }

      )

      console.log(response.data)

      alert('Upload queued successfully')

    } catch (error) {

      console.error(error)

      alert('Upload failed')

    }

    setUploading(false)

  }


  return (

    <div className="h-screen w-screen bg-[#0f1115] text-white flex flex-col items-center justify-center gap-6">

      <div className="text-3xl font-bold text-cyan-300">
        AUTO UPLOADER
      </div>

      <div className="flex flex-col gap-4 w-[420px] bg-[#151922] p-6 rounded-2xl border border-white/10">

        <input

          type="file"

          accept="video/*"

          onChange={(e) => {

            setVideoFile(
              e.target.files[0]
            )

          }}

          className="bg-white/5 border border-white/10 rounded-xl p-3"

        />

        <input

          type="file"

          accept="image/*"

          onChange={(e) => {

            setThumbnailFile(
              e.target.files[0]
            )

          }}

          className="bg-white/5 border border-white/10 rounded-xl p-3"

        />

        <button

          onClick={handleUpload}

          className="bg-cyan-500 hover:bg-cyan-400 transition-all rounded-xl py-3 font-semibold text-black"

        >

          {

            uploading

              ? 'UPLOADING...'

              : 'UPLOAD TO YOUTUBE'

          }

        </button>

      </div>

    </div>

  )

}