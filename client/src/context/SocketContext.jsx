import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [liveAlerts, setLiveAlerts] = useState([])

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current.on('new-alert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev])
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [user])

  const dismissAlert = (id) => {
    setLiveAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, liveAlerts, dismissAlert }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
