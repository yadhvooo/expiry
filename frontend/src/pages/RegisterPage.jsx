import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Store, Sparkles, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function RegisterPage({ setView }) {
  const { registerCustomer, registerProvider } = useAuth();
  const [roleTab, setRoleTab] = useState('customer'); // customer, provider
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');

  // Provider-Specific Fields
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessType, setBusinessType] = useState('Bakery');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bankAccountDetails, setBankAccountDetails] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (roleTab === 'customer') {
        await registerCustomer({
          email,
          password,
          fullName,
          phone,
          addressLine: address || 'Indiranagar',
          city: 'Bangalore'
        });
        setView('home');
      } else {
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
          'Provider application submitted! Your account status is PENDING admin verification. You can log in and view your onboarding status.'
        );
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-xl space-y-5">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-stone-900">Join RescueBites</h1>
          <p className="text-xs text-stone-500">Sign up as a surplus food customer or register your food store</p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setRoleTab('customer')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'customer'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('provider')}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              roleTab === 'provider'
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Food Provider</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Application Received</p>
              <p className="mt-0.5 leading-relaxed">{successMsg}</p>
              <button
                onClick={() => setView('login')}
                className="mt-2 text-xs font-bold underline text-emerald-950"
              >
                Proceed to Login
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {roleTab === 'customer' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Store / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Daily Crumb Bakery"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  >
                    <option value="Supermarket">Supermarket</option>
                    <option value="Bakery & Café">Bakery & Café</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Cloud Kitchen">Cloud Kitchen</option>
                    <option value="Dairy Parlour">Dairy Parlour</option>
                    <option value="Food Manufacturer">Food Manufacturer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">FSSAI / Food License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. FSSAI-112233445566"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Store Address for Customer Pickup *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 80 Feet Road, 4th Block, Koramangala, Bangalore"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bank / UPI Payout Info</label>
                <input
                  type="text"
                  placeholder="e.g. UPI: store@okaxis or Bank A/C details"
                  value={bankAccountDetails}
                  onChange={(e) => setBankAccountDetails(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {/* Email & Password for All */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Submitting...' : roleTab === 'customer' ? 'Create Customer Account' : 'Register Provider (Pending Approval)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{' '}
          <button
            onClick={() => setView('login')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Sign In here
          </button>
        </div>
      </div>
    </div>
  );
}
