import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Bike, 
  MapPin, 
  User, 
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useFranchiseStore } from '../store/franchiseStore';
import toast from 'react-hot-toast';

export const OrdersPage: React.FC = () => {
  const { session } = useFranchiseStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const fId = session?.franchiseId || 'fra_rajnandgaon';
      const res = await fetchApi(`/api/franchises/${fId}/live-orders`);
      if (res && res.orders) {
        setOrders(res.orders);
      } else {
        // Fallback default sample orders
        setOrders([
          {
            id: 'ord_101',
            orderNumber: 'OP-8291',
            customerName: 'Rohit Sharma',
            customerPhone: '+91 98261 11223',
            deliveryAddress: 'House 44, Kailash Nagar, Rajnandgaon',
            branchName: 'Rajnandgaon HQ',
            source: 'ONLINE_APP',
            status: 'PREPARING',
            totalAmount: 580,
            paymentMethod: 'UPI',
            paymentStatus: 'PAID',
            items: [
              { name: 'Farm Fresh Deluxe Pizza (Medium)', quantity: 1, price: 399 },
              { name: 'Garlic Breadsticks', quantity: 1, price: 129 },
              { name: 'Coke 500ml', quantity: 1, price: 52 }
            ],
            createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
          },
          {
            id: 'ord_102',
            orderNumber: 'OP-8292',
            customerName: 'Ananya Verma',
            customerPhone: '+91 97130 55441',
            deliveryAddress: 'Table #4 (Dine-In)',
            branchName: 'Rajnandgaon HQ',
            source: 'POS_DINE_IN',
            status: 'ACCEPTED',
            totalAmount: 740,
            paymentMethod: 'CASH',
            paymentStatus: 'PAID',
            items: [
              { name: 'Paneer Makhani Feast (Large)', quantity: 1, price: 599 },
              { name: 'Cheese Dip', quantity: 2, price: 70 }
            ],
            createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
          }
        ]);
      }
    } catch (err) {
      console.warn('[OrdersPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 15000);
    return () => clearInterval(timer);
  }, [session?.franchiseId]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone || '').includes(search);

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'KITCHEN' && ['PENDING', 'ACCEPTED', 'PREPARING'].includes(o.status)) ||
      (statusFilter === 'DELIVERY' && o.status === 'OUT_FOR_DELIVERY') ||
      (statusFilter === 'COMPLETED' && o.status === 'DELIVERED') ||
      (statusFilter === 'CANCELLED' && o.status === 'CANCELLED');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-black text-2xl text-white">Franchise Live Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of all dine-in, takeaway, and delivery orders across franchise branches
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'KITCHEN', 'DELIVERY', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition ${
              statusFilter === st
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Amount</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <span className="font-mono font-bold text-white block">{o.orderNumber || o.id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(o.createdAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-200 block">{o.customerName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{o.customerPhone}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-200">{o.branchName || 'Main Branch'}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-950 text-slate-300 border border-slate-800">
                      {o.source || 'ONLINE'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      o.status === 'PREPARING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : o.status === 'DELIVERED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-400">
                    ₹{o.totalAmount?.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base">Order #{selectedOrder.orderNumber || selectedOrder.id}</h3>
                  <p className="text-xs text-slate-400">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Customer Details</span>
                  <p className="font-bold text-white">{selectedOrder.customerName}</p>
                  <p className="text-slate-400 font-mono">{selectedOrder.customerPhone}</p>
                  <p className="text-slate-300 mt-1">{selectedOrder.deliveryAddress || 'Dine-In'}</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Ordered Items</span>
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-200">{it.quantity}x {it.name}</span>
                      <span className="font-mono text-amber-400 font-bold">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Total Amount</span>
                <span className="text-xl font-mono font-black text-amber-400">₹{selectedOrder.totalAmount}</span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
