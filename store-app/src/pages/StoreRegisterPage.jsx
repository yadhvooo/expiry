import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, ShieldCheck, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';

export default function StoreRegisterPage({ setView }) {
  const { registerProvider } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('Bakery');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bankAccountDetails, setBankAccountDetails] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await registerProvider({
        email,
        password,
        fullName: ownerName || businessName,
        phone,
        businessName,
        ownerName,
        businessType,
        address,
        latitude: 12.9716,
        longitude: 77.5946,
        licenseNumber,
        bankAccountDetails
      });
      setSuccessMsg(
        'Store onboarding application submitted! Your FSSAI license is now in PENDING status for admin review. You can log in to your dashboard to inspect your setup.'
      );
    } catch (err) {
      setError(err.message || 'Failed to submit store application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl p-8 max-w-xl w-full border border-stone-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">Partner Store Onboarding</h1>
          <p className="text-xs text-stone-500">List near-expiry surplus food, minimize food waste, and recover margin</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-base">Application Submitted!</h3>
            <p className="text-xs leading-relaxed text-emerald-800">{successMsg}</p>
            <button
              onClick={() => setView('login')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-block"
            >
              Go to Store Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Business / Store Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Crust Bakery"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Manager / Owner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Business Category</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500 bg-white"
                >
                  <option value="Bakery">Bakery & Patisserie</option>
                  <option value="Supermarket">Supermarket & Grocery</option>
                  <option value="Cafe">Cafe & Bistro</option>
                  <option value="Cloud Kitchen">Cloud Kitchen / Prepared Meals</option>
                  <option value="Dairy Outlet">Dairy & Sweet Shop</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <span>FSSAI License Number</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                </label>
                <input
                  type="text"
                  required
                  placeholder="14-digit FSSAI number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Store Physical Address</label>
              <input
                type="text"
                required
                placeholder="Shop No., Street, Area, Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="manager@bakery.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Bank Account / UPI ID for Payouts</label>
                <input
                  type="text"
                  placeholder="e.g. store@okhdfcbank"
                  value={bankAccountDetails}
                  onChange={(e) => setBankAccountDetails(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Submitting onboarding application...' : 'Submit Store Application'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center text-xs text-stone-500">
          Already registered?{' '}
          <button
            onClick={() => setView('login')}
            className="text-amber-700 font-bold hover:underline"
          >
            Store Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
