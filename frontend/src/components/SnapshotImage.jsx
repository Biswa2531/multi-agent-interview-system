import { useState, useEffect } from 'react'
import api from '../api'

function SnapshotImage({ url }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let objectUrl = null

    const fetchSnapshot = async () => {
      try {
        // The 'api' instance automatically attaches the JWT token in the headers
        const response = await api.get(url, { responseType: 'blob' })
        
        if (isMounted) {
          objectUrl = URL.createObjectURL(response.data)
          setImageUrl(objectUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error(`Failed to load snapshot ${url}:`, err)
        if (isMounted) setLoading(false)
      }
    }

    fetchSnapshot()

    return () => {
      isMounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-[10px] animate-pulse">
        Loading...
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 text-red-400 text-[10px]">
        🔒 Protected
      </div>
    )
  }

  return (
    <img 
      src={imageUrl} 
      alt="Snapshot" 
      className="w-full h-full object-cover"
    />
  )
}

export default SnapshotImage