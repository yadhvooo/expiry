import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, CheckCircle, Store, Clock, ShieldCheck } from 'lucide-react';

export default function QRCodeModal({ order, onClose }) {
  if (!order) return null;

  const qrValue = order.qrCodeData || JSON.stringify({
    orderId: order.id,
    orderNumber: order.orderNumber,
    pickupCode: order.pickupCode
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-stone-900">
          ORDER #{order.orderNumber || order.order_number}
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">Show this code or QR at the store counter</p>

        {/* Pickup Code Display */}
        <div className="my-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 inline-block w-full">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
            Pickup Verification Code
          </span>
          <span className="text-3xl font-black tracking-widest text-emerald-950 font-mono mt-1 block">
            {order.pickupCode || order.pickup_code}
          </span>
        </div>

        {/* QR Code */}
        <div className="p-4 bg-white border-2 border-dashed border-stone-200 rounded-2xl inline-block shadow-sm">
          <QRCodeSVG
            value={qrValue}
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Provider Details */}
        <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1 text-left">
          {order.providerName || order.provider_name ? (
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{order.providerName || order.provider_name}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-1.5 text-stone-500">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Pickup Time: {order.pickupStartTime || order.pickup_start_time || '10:00'} - {order.pickupEndTime || order.pickup_end_time || '21:00'}</span>
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 pt-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Order is confirmed & ready for collection.</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
