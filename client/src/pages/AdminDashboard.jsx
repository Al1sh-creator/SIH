import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as adminApi from '../api/adminApi'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [broadcastMsg, setBroadcastMsg] = useState('')
  const [broadcastLoading, setBroadcastLoading] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [statsRes, usersRes, inspRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getInspections()
      ])
      setStats(statsRes.data.stats)
      setUsers(usersRes.data.users)
      setInspections(inspRes.data.inspections)
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!broadcastMsg) return
    setBroadcastLoading(true)
    setBroadcastSuccess('')
    try {
      await adminApi.sendBroadcast({ message: broadcastMsg })
      setBroadcastSuccess('Broadcast sent successfully!')
      setBroadcastMsg('')
    } catch (err) {
      console.error(err)
      alert('Failed to send broadcast.')
    } finally {
      setBroadcastLoading(false)
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return
    try {
      await adminApi.deleteUser(id)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.')
    }
  }

  const handleUpdateStatus = async (id, status, preferredDate = null) => {
    let scheduled_date = null
    
    if (status === 'scheduled') {
      if (preferredDate) {
        // Accept preferred date
        scheduled_date = preferredDate
      } else {
        // Give alternate date
        const dateStr = window.prompt('Enter alternate date (YYYY-MM-DD):')
        if (!dateStr) return
        scheduled_date = dateStr
      }
    }
    
    try {
      await adminApi.updateInspection(id, { status, scheduled_date })
      fetchData()
    } catch (err) {
      alert('Failed to update status.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in p-2 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 font-body mt-1">Platform overview and user management.</p>
        </div>
      </div>

      {/* Broadcast Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Send Global Broadcast</h2>
        <form onSubmit={handleBroadcast} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Type a message to alert all users..."
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
            className="flex-1 input-field"
            required
          />
          <button 
            type="submit" 
            disabled={broadcastLoading}
            className="btn-primary whitespace-nowrap"
          >
            {broadcastLoading ? 'Sending...' : '📢 Send Broadcast'}
          </button>
        </form>
        {broadcastSuccess && <p className="text-green-600 text-sm mt-2">{broadcastSuccess}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl">👥</div>
            <div>
              <p className="text-sm text-gray-500 font-body">Total Users</p>
              <h3 className="font-heading font-bold text-2xl">{stats?.totalUsers || 0}</h3>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center text-2xl">🚜</div>
            <div>
              <p className="text-sm text-gray-500 font-body">Total Farms</p>
              <h3 className="font-heading font-bold text-2xl">{stats?.totalFarms || 0}</h3>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-2xl">🚨</div>
            <div>
              <p className="text-sm text-gray-500 font-body">Total Alerts</p>
              <h3 className="font-heading font-bold text-2xl">{stats?.totalAlerts || 0}</h3>
            </div>
          </div>
        </div>

        {/* Crop Distribution Analytics */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm lg:row-span-2">
          <h2 className="font-heading font-bold text-lg text-gray-900 mb-4">Crop Analytics</h2>
          <div className="space-y-4">
            {stats?.crops?.length > 0 ? (
              stats.crops.map((crop, idx) => {
                const percentage = Math.round((crop.count / stats.totalFarms) * 100);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{crop.name}</span>
                      <span className="text-gray-500">{percentage}% ({crop.count} farms)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-400 text-sm">No crops recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-heading font-bold text-lg text-gray-900">Registered Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Profile Status</th>
                <th className="px-6 py-4 font-semibold">Farm Info</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-xs text-gray-400">Joined: {new Date(u.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{u.email}</div>
                    <div className="text-xs text-gray-400">{u.phone !== '0000000000' ? u.phone : 'No Phone'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {u.profile_completed ? (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Incomplete
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.farm_id ? (
                      <div>
                        <span className="font-medium text-gray-800">{u.farm_name}</span>
                        <div className="text-xs text-gray-500">{u.state} • {u.current_crop}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No farm</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.is_admin ? (
                      <span className="inline-flex items-center py-1 px-2.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                        🛡️ Admin
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs">User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!u.is_admin && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Requests Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-heading font-bold text-lg text-gray-900">Soil Inspection Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Requested By</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Preferred Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inspections.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{i.user_name}</div>
                    <div className="text-xs text-gray-400">{i.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{i.farm_name}</div>
                    <div className="text-xs text-gray-400">{i.district}</div>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(i.preferred_date).toLocaleDateString()}
                    {i.notes && <div className="text-[10px] text-gray-400 mt-1 max-w-[200px] truncate">Note: {i.notes}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center py-1 px-2.5 rounded-lg text-xs font-bold border ${
                      i.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                      i.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {i.status.toUpperCase()}
                      {i.status === 'scheduled' && i.scheduled_date && ` (${new Date(i.scheduled_date).toLocaleDateString()})`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {i.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(i.id, 'scheduled', i.preferred_date)} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 font-semibold">
                            Accept Date
                          </button>
                          <button onClick={() => handleUpdateStatus(i.id, 'scheduled', null)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-semibold">
                            Alternate Date
                          </button>
                        </>
                      )}
                      {i.status === 'scheduled' && (
                        <button onClick={() => handleUpdateStatus(i.id, 'completed')} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded hover:bg-purple-100 font-semibold">
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    No inspection requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
