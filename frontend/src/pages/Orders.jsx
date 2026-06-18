import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Plus, Trash2, X } from 'lucide-react'

export default function Orders() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: data => api.post('/orders', data),
    onSuccess: () => {
      qc.invalidateQueries(['orders'])
      qc.invalidateQueries(['products'])
      toast.success('Order created')
      setShowModal(false)
      setCustomerId('')
      setItems([{ product_id: '', quantity: 1 }])
    },
    onError: e => toast.error(e.response?.data?.detail || 'Error creating order'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/orders/${id}`),
    onSuccess: () => { qc.invalidateQueries(['orders']); toast.success('Order cancelled') },
    onError: e => toast.error(e.response?.data?.detail || 'Error cancelling order'),
  })

  const addItem = () => setItems(i => [...i, { product_id: '', quantity: 1 }])
  const removeItem = idx => setItems(i => i.filter((_, i2) => i2 !== idx))
  const updateItem = (idx, field, val) => setItems(i => i.map((item, i2) => i2 === idx ? { ...item, [field]: val } : item))

  const handleSubmit = e => {
    e.preventDefault()
    createMutation.mutate({
      customer_id: parseInt(customerId),
      items: items.map(i => ({ product_id: parseInt(i.product_id), quantity: parseInt(i.quantity) }))
    })
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          <p className="text-gray-500 mt-1">Track and manage orders</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const customer = customers.find(c => c.id === o.customer_id)
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">#{o.id}</td>
                    <td className="py-3 px-4 font-medium text-gray-800">{customer?.full_name || `Customer #${o.customer_id}`}</td>
                    <td className="py-3 px-4 text-gray-500">{o.order_items?.length || 0} item(s)</td>
                    <td className="py-3 px-4 font-medium text-gray-800">₹{o.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => deleteMutation.mutate(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Create Order</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={e => updateItem(idx, 'product_id', e.target.value)}
                        required
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                        required
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-gray-400 hover:text-red-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  + Add another item
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}