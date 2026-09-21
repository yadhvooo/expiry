import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UrgencyBadge from '../components/UrgencyBadge';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Store,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Package
} from 'lucide-react';

export default function ProviderProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mrp, setMrp] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('50');
  const [quantity, setQuantity] = useState('5');
  const [bestBeforeDate, setBestBeforeDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [storageInstructions, setStorageInstructions] = useState('Store below 4°C in refrigerator');
  const [pickupStartTime, setPickupStartTime] = useState('10:00');
  const [pickupEndTime, setPickupEndTime] = useState('21:00');
  const [autoDiscount, setAutoDiscount] = useState(true);

  // Auto-calculated discounted price
  const origPriceNum = parseFloat(originalPrice) || 0;
  const discountNum = parseFloat(discountPercent) || 0;
  const calculatedDiscountedPrice = Math.max(
    0,
    Math.round(origPriceNum * (1 - discountNum / 100) * 100) / 100
  );

  useEffect(() => {
    loadData();
  }, []);

  // Update auto-discount recommendations when date changes if autoDiscount is enabled
  useEffect(() => {
    if (autoDiscount && bestBeforeDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(bestBeforeDate);
      target.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

      if (diffDays > 7) setDiscountPercent('0');
      else if (diffDays >= 3) setDiscountPercent('20');
      else if (diffDays === 2) setDiscountPercent('30');
      else if (diffDays <= 1) setDiscountPercent('50');
    }
  }, [bestBeforeDate, autoDiscount]);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProviderProducts(),
        api.getCategories()
      ]);
      setProducts(prodRes.products || []);
      setCategories(catRes.categories || []);
      if (catRes.categories?.length > 0 && !categoryId) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load provider catalog', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80');
    setMrp('100');
    setOriginalPrice('100');
    setDiscountPercent('50');
    setQuantity('5');
    setStorageInstructions('Store in a cool, dry place');
    setAutoDiscount(true);
    setIsModalOpen(true);
  }

  function openEditModal(prod) {
    setEditingProduct(prod);
    setName(prod.name);
    setCategoryId(prod.category_id);
    setDescription(prod.description || '');
    setImageUrl(prod.image_url || '');
    setMrp(String(prod.mrp || prod.original_price));
    setOriginalPrice(String(prod.original_price));
    setDiscountPercent(String(prod.discount_percent));
    setQuantity(String(prod.quantity));
    setBestBeforeDate(prod.best_before_date);
    setExpiryDate(prod.expiry_date || prod.best_before_date);
    setStorageInstructions(prod.storage_instructions || '');
    setPickupStartTime(prod.pickup_start_time || '10:00');
    setPickupEndTime(prod.pickup_end_time || '21:00');
    setAutoDiscount(Boolean(prod.auto_discount));
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name,
      categoryId,
      description,
      imageUrl,
      mrp: parseFloat(mrp) || parseFloat(originalPrice),
      originalPrice: parseFloat(originalPrice),
      discountPercent: parseFloat(discountPercent),
      quantity: parseInt(quantity, 10),
      bestBeforeDate,
      expiryDate: expiryDate || bestBeforeDate,
      storageInstructions,
      pickupStartTime,
      pickupEndTime,
      autoDiscount
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        setSuccessMsg('Product listing updated successfully!');
      } else {
        await api.createProduct(payload);
        setSuccessMsg('New surplus food listing created!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.message || 'Failed to save product listing.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to deactivate and remove this listing from the marketplace?')) return;
    try {
      await api.deleteProduct(id);
      loadData();
    } catch (err) {
      console.error('Delete product error:', err);
      alert('Failed to delete product.');
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Surplus Food Catalog</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage near-expiry listings, configure dynamic discounts, and maintain food-safety standards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Listing</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter catalog products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-stone-100 border border-stone-200 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500 font-semibold">
          <span>{filteredProducts.length} Listings</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 uppercase font-bold text-[11px] text-stone-500">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Expiry Classification</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-stone-400">
                    No products found in your catalog. Click "Create New Listing" to add your first item!
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-stone-900 text-xs sm:text-sm">{p.name}</div>
                          <div className="text-[11px] text-stone-400">
                            Best Before: <strong>{p.best_before_date}</strong>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-stone-700">
                      {p.category_name}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-stone-900 text-sm">
                          ₹{Math.round(p.discounted_price)}
                        </span>
                        <span className="text-[11px] text-stone-400 line-through">
                          ₹{Math.round(p.original_price)}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Math.round(p.discount_percent)}% OFF
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <UrgencyBadge
                        status={p.expiry_status}
                        badge={p.expiry_badge}
                        daysRemaining={p.days_remaining}
                      />
                    </td>

                    <td className="py-3 px-4 font-bold text-stone-900">
                      {p.quantity} units
                    </td>

                    <td className="py-3 px-4">
                      {p.is_active && p.is_sellable ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active & Live
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-stone-400 hover:text-emerald-700 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit listing"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete / Deactivate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Listing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-stone-900 mb-1">
              {editingProduct ? 'Edit Surplus Food Listing' : 'Create Surplus Food Listing'}
            </h2>
            <p className="text-xs text-stone-500 mb-4">
              Enter product expiry, set manual or auto-discount, and ensure legal food labeling
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Malai Paneer 200g"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Pricing & Auto-Discount Section */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Automatic Shelf-Life Discounting
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDiscount}
                      onChange={(e) => setAutoDiscount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">MRP (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Original Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 outline-none"
                    />
                  </div>
                </div>

                {/* Automatically calculated price display */}
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">Customer Deal Price:</span>
                  <span className="text-base font-extrabold text-emerald-700">
                    ₹{calculatedDiscountedPrice} ({discountPercent}% OFF)
                  </span>
                </div>
              </div>

              {/* Dates & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Best-Before Date *</label>
                  <input
                    type="date"
                    required
                    value={bestBeforeDate}
                    onChange={(e) => setBestBeforeDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity Stock *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
              </div>

              {/* Storage Instructions */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Storage Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Keep refrigerated below 4°C"
                  value={storageInstructions}
                  onChange={(e) => setStorageInstructions(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              {/* Pickup Time Window */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Pickup Start Time</label>
                  <input
                    type="time"
                    value={pickupStartTime}
                    onChange={(e) => setPickupStartTime(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Pickup End Time</label>
                  <input
                    type="time"
                    value={pickupEndTime}
                    onChange={(e) => setPickupEndTime(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                >
                  {editingProduct ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
