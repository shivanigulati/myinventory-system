import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const empty = { name: '', sku: '', price: '', quantity: '' }

export default function Products() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: data => api.post('/products', data),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product created'); closeModal() },
    onError: e => toast.error(e.response?.data?.detail || 'Error creating product'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/products/${id}`, data),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product updated'); closeModal() },
    onError: e => toast.error(e.response?.data?.detail || 'Error updating product'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product deleted') },
    onError: e => toast.error(e.response?.data?.detail || 'Error deleting product'),
  })

  const closeModal = () => { setShowModal(false); setForm(empty); setEditing(null) }
  const openCreate = () => { setForm(empty); setEditing(null); setShowModal(true) }
  const openEdit = p => { setForm({ name: p.name, sku: p.sku, price: p.price, quantity: p.quantity }); setEditing(p.id); setShowModal(true) }

  const handleSubmit = e => {
    e.preventDefault()
    const payload = { ...form, price: parseFloat(form.price), quantity: parseInt(form.quantity) }
    editing ? updateMutation.mutate({ id: editing, data: payload }) : createMutation.mutate(payload)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No products yet. Add your first product.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'SKU', 'Price', 'Stock', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 px-4 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 px-4 text-gray-800">₹{p.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.quantity < 5 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {p.quantity} units
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Product Name', key: 'name', type: 'text', placeholder: 'e.g. Wireless Mouse' },
                { label: 'SKU', key: 'sku', type: 'text', placeholder: 'e.g. WM-001' },
                { label: 'Price', key: 'price', type: 'number', placeholder: '0.00' },
                { label: 'Quantity', key: 'quantity', type: 'number', placeholder: '0' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}