import { useQuery } from '@tanstack/react-query'
import api from '../api/axios'
import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data),
  })
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => api.get('/customers').then(r => r.data),
  })
  const { data: orders = [] } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  })

  const lowStock = products.filter(p => p.quantity < 5)

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Customers', value: customers.length, icon: Users, color: 'bg-green-50 text-green-700' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-purple-50 text-purple-700' },
    { label: 'Low Stock Items', value: lowStock.length, icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your inventory system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-500">{label}</span>
              <span className={`p-2 rounded-lg ${color}`}>
                <Icon size={18} />
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            Low Stock Alert
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">Product</th>
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">SKU</th>
                  <th className="text-left py-2 px-4 text-gray-500 font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-2 px-4 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 px-4 text-gray-500">{p.sku}</td>
                    <td className="py-2 px-4">
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
                        {p.quantity} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}