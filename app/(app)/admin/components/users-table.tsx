'use client'

import { useState } from 'react'
import { updateUserRole, deleteUser, createUser } from '../actions'

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: Date
}

export function UsersTable({ users }: { users: User[] }) {
  const [isPending, setIsPending] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const handleRoleChange = async (userId: string, currentRole: string) => {
    setIsPending(userId)
    try {
      await updateUserRole(userId, currentRole)
    } catch (e: any) {
      alert(e.message || 'Failed to update role')
    } finally {
      setIsPending(null)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return
    
    setIsPending(userId)
    try {
      await deleteUser(userId)
    } catch (e: any) {
      alert(e.message || 'Failed to delete user')
    } finally {
      setIsPending(null)
    }
  }

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending('new')
    const formData = new FormData(e.currentTarget)
    
    try {
      await createUser(formData)
      setShowAddForm(false)
      ;(e.target as HTMLFormElement).reset()
    } catch (e: any) {
        alert(e.message || 'Failed to create user')
    } finally {
      setIsPending(null)
    }
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border">
                <td className="px-6 py-4">
                  <div className="font-medium text-foreground">{user.name || 'Anonymous User'}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  {(user.role !== 'admin' || users.filter(u => u.role === 'admin').length > 1) && (
                    <>
                      <button 
                        onClick={() => handleRoleChange(user.id, user.role)}
                        disabled={isPending === user.id}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        {user.role === 'admin' ? 'Demote to User' : 'Make Admin'}
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        disabled={isPending === user.id}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        {!showAddForm ? (
             <button 
                onClick={() => setShowAddForm(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
            >
                Add User Manually
            </button>
        ) : (
            <form onSubmit={handleAddUser} className="space-y-4 max-w-sm">
                <h3 className="font-semibold">Add New User</h3>
                
                <input required type="text" name="name" placeholder="Name" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                <input required type="email" name="email" placeholder="Email" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                <input required type="password" name="password" placeholder="Password" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
                
                <select name="role" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>

                <div className="flex gap-2">
                    <button 
                        type="submit" 
                        disabled={isPending === 'new'}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {isPending === 'new' ? 'Creating...' : 'Create'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setShowAddForm(false)}
                        className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  )
}
