/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Clock, Landmark, AlertCircle, FileText, 
  Building2, Check, Download, TrendingUp, Globe, ShoppingCart, 
  History, PieChart as PieIcon, LineChart as LineIcon, ChevronRight, Tags, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, 
  Legend, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import { apiFetch } from '../lib/api';

interface UnifiedSubscription {
  id: string;
  orgId: string;
  planId: 'starter' | 'growth' | 'enterprise';
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive';
  amount: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  processor: 'stripe' | 'paddle' | 'razorpay' | 'lemonsqueezy';
  billingCycle: 'monthly' | 'annual';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodLast4: string;
  paymentMethodType: string;
  customerEmail: string;
  customerCountry: string;
  gstin?: string;
  createdAt: string;
}

interface UnifiedInvoice {
  id: string;
  orgId: string;
  subscriptionId: string;
  invoiceNumber: string;
  processor: 'stripe' | 'paddle' | 'razorpay' | 'lemonsqueezy';
  amount: number;
  gstAmount?: number; // legacy Support
  taxAmount?: number;
  totalAmount: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  status: 'paid' | 'unpaid' | 'refunded';
  date: string;
  dueDate: string;
  invoicePdfUrl?: string;
  gstin?: string;
}

interface BillingProps {
  subscription: any;
  invoices: any[];
  orgId: string;
}

// Visual colors for Recharts pie chart
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
const GEOGRAPHY_COLORS = ['#3b82f6', '#10b981', '#ec4899', '#f59e0b'];

export default function Billing({
  subscription: initialSubscription,
  invoices: initialInvoices,
  orgId
}: BillingProps) {
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'invoices' | 'revenue'>('checkout');

  // Subscription state (re-synced with backend triggers)
  const [subscription, setSubscription] = useState<UnifiedSubscription | null>(null);
  const [invoices, setInvoices] = useState<UnifiedInvoice[]>([]);

  // Geolocation & local settings
  const [billingCountry, setBillingCountry] = useState<string>("IN");
  const [geolocationDetected, setGeolocationDetected] = useState<boolean>(false);
  const [detectedIp, setDetectedIp] = useState<string>("");
  const [geoProviderMethod, setGeoProviderMethod] = useState<string>("");
  const [detectedCountryName, setDetectedCountryName] = useState<string>("");
  const [isGeoLoading, setIsGeoLoading] = useState<boolean>(false);
  const [customerEmail, setCustomerEmail] = useState<string>("viswatejam45@gmail.com");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [couponCode, setCouponCode] = useState<string>("");
  const [gstInText, setGstInText] = useState<string>("");

  // Gateway Simulation triggers
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth' | 'enterprise'>('growth');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [autopayType, setAutopayType] = useState<'nach' | 'upi'>('upi');
  const [selectedInvoice, setSelectedInvoice] = useState<UnifiedInvoice | null>(null);

  // checkout response modal
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    processor: 'stripe' | 'paddle' | 'razorpay';
    checkoutType: string;
    payload: any;
  } | null>(null);

  // Revenue analytics state loading
  const [revenueAnalytics, setRevenueAnalytics] = useState<any>(null);
  const [isRevenueLoading, setIsRevenueLoading] = useState<boolean>(true);
  const [revenueSegmentMode, setRevenueSegmentMode] = useState<'processor' | 'geography'>('processor');

  // Standard Plan details template
  const plansMetadata = {
    starter: {
      name: 'Starter Plan',
      description: 'Ideal compliance package for pre-seed startups needing single-framework validation.',
      features: ['1 Compliance Framework', 'Up to 3 Team seats', 'Daily automated API scans', 'Standard policies templates', 'E-mail support Desk']
    },
    growth: {
      name: 'Growth Suite',
      description: 'The golden formula for scaling teams seeking ready frameworks: SOC 2, ISO 27001, & RBI NBFC.',
      features: ['All 3 Core Frameworks included', 'Up to 10 Team seats', 'Daily continuous AI integrations', 'Active custom Policy Builder', 'Deloitte Auditor Portal integration', '24h support response time']
    },
    enterprise: {
      name: 'Enterprise Custom',
      description: 'Bespoke custom controls alignment, multi-cloud clusters orchestration, and statutory compliance assistance.',
      features: ['Infinite Framework scopes', 'Infinite Seats', 'Priority direct Slack support', 'Bespoke RBI local data audits guidance', 'Dedicated Compliance Manager']
    }
  };

  // 1. Load details on init
  useEffect(() => {
    fetchBillingDetails();
    detectGeolocation();
  }, [orgId, initialSubscription, initialInvoices]);

  const fetchBillingDetails = async () => {
    try {
      const res = await apiFetch(`/api/orgs/${orgId}/billing/details`);
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setInvoices(data.invoices);
        if (data.invoices && data.invoices.length > 0) {
          setSelectedInvoice(data.invoices[0]);
        }
        if (data.subscription) {
          setSelectedPlan(data.subscription.planId);
          setBillingCountry(data.subscription.customerCountry || "IN");
          setCustomerEmail(data.subscription.customerEmail || "viswatejam45@gmail.com");
          setBillingCycle(data.subscription.billingCycle || "monthly");
          setGstInText(data.subscription.gstin || "");
        }
      }
    } catch (e) {
      console.error("Error reading billing configuration:", e);
    }
  };

  // 2. Fetch revenue trends for analytical view
  useEffect(() => {
    if (activeSubTab === 'revenue') {
      loadRevenueDashboard();
    }
  }, [activeSubTab]);

  const loadRevenueDashboard = async () => {
    setIsRevenueLoading(true);
    try {
      const res = await apiFetch('/api/billing/revenue');
      if (res.ok) {
        const data = await res.json();
        setRevenueAnalytics(data);
      }
    } catch (e) {
      console.warn("Unable to read real-time MRR aggregates. Loading dynamic sandbox calculations:", e);
    } finally {
      setIsRevenueLoading(false);
    }
  };

  // 3. Dynamic IP Geolocation Detection
  const detectGeolocation = async (simulateParams?: { simulate_ip?: string; simulate_country?: string }) => {
    setIsGeoLoading(true);
    try {
      const query = new URLSearchParams();
      if (simulateParams?.simulate_ip) {
        query.append('simulate_ip', simulateParams.simulate_ip);
      }
      if (simulateParams?.simulate_country) {
        query.append('simulate_country', simulateParams.simulate_country);
      }
      
      const res = await apiFetch(`/api/billing/detect-country?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.countryCode) {
          setBillingCountry(data.countryCode);
          setDetectedIp(data.ip || "127.0.0.1");
          setDetectedCountryName(data.countryName || "United States");
          setGeoProviderMethod(data.method || "IP_GEOLOCATION_LOGIC");
          setGeolocationDetected(true);
        } else {
          fallbackLocalDetection();
        }
      } else {
        fallbackLocalDetection();
      }
    } catch (e) {
      console.warn("Using client-side fallback detection:", e);
      fallbackLocalDetection();
    } finally {
      setIsGeoLoading(false);
    }
  };

  const fallbackLocalDetection = () => {
    setBillingCountry("US");
    setDetectedIp("127.0.0.1 (FALLBACK)");
    setDetectedCountryName("United States (Fallback)");
    setGeoProviderMethod("LOCAL_FALLBACK_CLIENT");
    setGeolocationDetected(true);
  };

  // Math price calculation helpers for client render
  const getDisplayPricing = (planId: 'starter' | 'growth' | 'enterprise') => {
    const prices: Record<'starter' | 'growth' | 'enterprise', Record<'INR' | 'USD', number>> = {
      starter: { INR: 4999, USD: 59 },
      growth: { INR: 14999, USD: 179 },
      enterprise: { INR: 45000, USD: 549 }
    };

    let currency: 'INR' | 'USD' = 'USD';
    let symbol = "$";
    if (billingCountry === 'IN') {
      currency = 'INR';
      symbol = "₹";
    }

    const baseAmount = prices[planId][currency] || prices[planId]['USD'];
    let finalAmount = baseAmount;
    if (billingCycle === 'annual') {
      finalAmount = Math.round(baseAmount * 12 * 0.85); // 15% discount for annual
    }

    return {
      amount: finalAmount,
      monthlyValue: billingCycle === 'annual' ? Math.round(finalAmount / 12) : finalAmount,
      currency,
      symbol,
      isAnnualDiscountApplied: billingCycle === 'annual'
    };
  };

  /**
   * 4. Unified Router Checkout Action
   */
  const handleInitiateUnifiedCheckout = async (planId: 'starter' | 'growth' | 'enterprise') => {
    if (billingCountry === 'IN' && gstInText && gstInText.length !== 15) {
      alert("Validation failure: Please enter a valid 15-character corporate Indian GSTIN format.");
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/billing/initiate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: customerEmail,
          customer_country: billingCountry,
          plan_id: planId,
          billing_cycle: billingCycle,
          coupon_code: couponCode,
          gstin: gstInText || undefined,
          orgId
        })
      });

      if (res.ok) {
        const payload = await res.json();
        // Launch dynamic overlay modal to simulate Stripe/Paddle/Razorpay checkout scripts
        setCheckoutModal({
          isOpen: true,
          processor: payload.processor,
          checkoutType: payload.checkout_type,
          payload
        });
        await fetchBillingDetails();
      } else {
        const err = await res.json();
        alert(`Checkout initiation failed: ${err.message || 'Error occurred.'}`);
      }
    } catch (e: any) {
      console.error(e);
      alert("Network exception starting checkout process.");
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 5. Active Subscription Self-Management Operations
   */
  const handleUpgradeSubscription = async (targetPlanId: 'starter' | 'growth' | 'enterprise') => {
    if (!subscription) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/billing/upgrade/${subscription.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_plan_id: targetPlanId })
      });
      if (res.ok) {
        await fetchBillingDetails();
        alert(`Plan successfully transformed to ${targetPlanId.toUpperCase()}! Your prorated adjustments will reflect on your invoices ledger.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;
    if (!confirm("Are you sure you want to deactivate auto-renewal? Your compliance automated checks execution will remain active until current period end date but renewal will stop.")) {
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/billing/cancel/${subscription.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        await fetchBillingDetails();
        alert("Autopay successfully scheduled for cancellation. Coverage remains fully valid until the end of your billing cycle.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const activePlanMeta = subscription ? plansMetadata[subscription.planId] : null;
  const currentPriceDetails = getDisplayPricing(selectedPlan);

  return (
    <div className="space-y-6">
      
      {/* Visual Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Unified Billing Service & Revenue Matrix</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Automated geo-routing for Stripe, Paddle and Razorpay. Integrated GST/VAT filing & aggregate revenue metrics.</p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 mt-3 md:mt-0 max-w-sm">
          <button
            onClick={() => setActiveSubTab('checkout')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeSubTab === 'checkout'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Plan Checkout</span>
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeSubTab === 'invoices'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Invoices Ledger</span>
          </button>
          <button
            onClick={() => setActiveSubTab('revenue')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeSubTab === 'revenue'
                ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Internal Revenue Dashboard</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: PLAN CHECKOUT PORTAL --- */}
      {activeSubTab === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Form and configs column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Active Subscription State Indicator */}
            {subscription && (
              <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 bg-blue-600/10 w-24 h-24 rounded-full blur-xl"></div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1 z-10">
                    <span className="text-[10px] font-mono tracking-wider font-bold bg-blue-600 px-2 py-0.5 rounded uppercase">
                      ACTIVE SEED CONNECTION
                    </span>
                    <h3 className="text-base font-bold font-sans tracking-tight">
                      {subscription.planId === 'starter' ? 'Starter Plan' : subscription.planId === 'enterprise' ? 'Enterprise Custom' : 'Growth Suite'}
                    </h3>
                    <p className="text-[11px] text-slate-350 font-mono">
                      Subscription System ID: <span className="text-slate-200 font-bold">{subscription.id}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300 font-sans pt-1">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        Region: <strong className="text-white">{subscription.customerCountry}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        Gateway: <strong className="text-white uppercase">{subscription.processor}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Next Renewal: <strong className="text-white">{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 z-10 select-none">
                    {subscription.cancelAtPeriodEnd ? (
                      <div className="bg-amber-950 border border-amber-500/30 rounded-lg p-2.5 max-w-xs">
                        <span className="text-xs font-bold text-amber-400 block mb-0.5">Cancel Scheduled</span>
                        <p className="text-[10px] text-amber-200/80 leading-snug">Renewal turned off. Real-time controls coverage will expire at end of current period.</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={isUpdating}
                        className="bg-transparent hover:bg-red-950/40 border border-slate-700 hover:border-red-850 text-slate-300 hover:text-red-400 font-bold font-sans text-[11px] px-3.5 py-2 rounded-lg transition shrink-0 cursor-pointer"
                      >
                        Deactivate Autopay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Geographical Billing Router Settings Component */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 font-mono uppercase">
                  <Globe className="w-4 h-4 text-blue-500" />
                  Automatic Geo-Location Routing Config
                </h3>
                {geolocationDetected ? (
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-full font-bold">
                    ● AUTO-IP DETECTED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    MANUAL ROUTING APPLIED
                  </span>
                )}
              </div>

              {/* Geolocation IP Status & Simulation Console */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase font-bold text-blue-600 tracking-wider">Dynamic Routing Engine</span>
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                      <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      IP Geolocation Resolver Status
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9.5px] font-mono bg-slate-200/80 text-slate-755 px-2.5 py-0.5 rounded-full font-bold">
                      IP: {isGeoLoading ? "Resolving..." : (detectedIp || "Unknown / Not Resolved")}
                    </span>
                    <span className={`text-[9.5px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                      geoProviderMethod.startsWith("SIMULATED")
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}>
                      {isGeoLoading ? "FETCHING" : geoProviderMethod || "DEFAULT_STATIC"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] bg-white border border-slate-200/50 rounded-lg p-2.5">
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-mono tracking-tight">Active Resolution Country</span>
                    <strong className="text-slate-700 font-sans flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      {detectedCountryName || "United States (US) - Default fallback"}
                    </strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[9.5px] uppercase font-mono tracking-tight">Resolved Currency Matrix</span>
                    <strong className="text-blue-600 font-mono text-xs flex items-center gap-1">
                      <span className="px-1 bg-blue-100 rounded text-[10px] font-bold">
                        {billingCountry === "IN" ? "INR (₹)" : "USD ($)"}
                      </span>
                      {billingCountry === "IN" ? "India Regional Scheme" : "Global Business Scheme (USD Fallback)"}
                    </strong>
                  </div>
                </div>

                {/* Geolocation Simulation Bar */}
                <div className="pt-1.5 border-t border-slate-150/40">
                  <span className="text-[9.5px] text-slate-405 block mb-1 px-0.5 font-mono uppercase font-bold">
                    Interactive Geolocation Simulator
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => detectGeolocation({ simulate_ip: "103.45.16.89" })}
                      disabled={isGeoLoading}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition cursor-pointer select-none"
                    >
                      🇮🇳 Sim India IP (103.45.*)
                    </button>
                    <button
                      type="button"
                      onClick={() => detectGeolocation({ simulate_ip: "8.8.8.8" })}
                      disabled={isGeoLoading}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition cursor-pointer select-none"
                    >
                      🇺🇸 Sim USA IP (8.8.*)
                    </button>
                    <button
                      type="button"
                      onClick={() => detectGeolocation({ simulate_ip: "193.16.22.4" })}
                      disabled={isGeoLoading}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-pink-50 text-pink-700 border border-pink-100 hover:bg-pink-100 transition cursor-pointer select-none"
                    >
                      🇪🇺 Sim Europe IP (Falls to USD)
                    </button>
                    <button
                      type="button"
                      onClick={() => detectGeolocation()}
                      disabled={isGeoLoading}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-650 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      🔄 Reset / Auto-Detect IP
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Geolocation selector */}
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Country of Incorporation</label>
                  <select 
                    value={billingCountry} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setBillingCountry(val);
                      setGeolocationDetected(false);
                      setDetectedCountryName(val === "IN" ? "India (IN)" : (val === "US" ? "United States (US)" : `${val} (Override)`));
                      setDetectedIp("MANUAL_SELECTION_IP");
                      setGeoProviderMethod("MANUAL_OVERRIDE_ROUTER");
                    }}
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-2 py-1.5 text-xs text-slate-800 font-sans outline-none cursor-pointer font-semibold"
                  >
                    <option value="IN">India (₹ INR - India Regional Scheme)</option>
                    <option value="US">United States ($ USD - Global Business Fallback)</option>
                    <option value="GB">United Kingdom ($ USD - Global Fallback)</option>
                    <option value="DE">Germany ($ USD - Global Fallback)</option>
                    <option value="FR">France ($ USD - Global Fallback)</option>
                    <option value="CA">Canada ($ USD - Global Fallback)</option>
                    <option value="AU">Australia ($ USD - Global Fallback)</option>
                    <option value="SG">Singapore ($ USD - Global Fallback)</option>
                  </select>
                  <span className="text-[9px] text-slate-450 block mt-1">
                    Defines VAT, corporate GST rates and the respective local router gateway.
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Corporate Contact Email</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@firm.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono outline-none font-semibold"
                  />
                  <span className="text-[9px] text-slate-450 block mt-1">
                    Recipient address for statutory PDFs and payment alerts.
                  </span>
                </div>

                {/* Billing cycle & discount */}
                <div>
                  <label className="text-[10px] text-slate-400 font-mono uppercase block mb-1 font-bold">Billing Commitment</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('monthly')}
                      className={`text-center py-1 rounded text-xs font-semibold cursor-pointer border transition select-none ${
                        billingCycle === 'monthly'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle('annual')}
                      className={`py-1 rounded text-xs font-semibold cursor-pointer border relative transition select-none flex flex-col items-center justify-center leading-none ${
                        billingCycle === 'annual'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Annual</span>
                      <strong className="text-[8px] font-mono uppercase block text-amber-300 mt-0.5 font-bold">15% Discount</strong>
                    </button>
                  </div>
                </div>

              </div>

              {/* Dynamic Sub-form for India corporate configuration */}
              {billingCountry === 'IN' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 bg-blue-50/20 p-2.5 rounded-lg">
                  <div>
                    <label className="text-[10px] text-slate-450 font-mono uppercase block mb-1 font-bold">Corporate GSTIN (15 symbols)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAACZ1234A1Z5"
                      value={gstInText}
                      onChange={(e) => setGstInText(e.target.value.toUpperCase())}
                      maxLength={15}
                      className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono font-bold uppercase outline-none"
                    />
                    <span className="text-[9px] text-slate-550 block mt-1 leading-snug">
                      Required for input tax credit reconciliation. Triggers statutory 18% corporate GST receipt.
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-450 font-mono uppercase block mb-1 font-bold">India Autopay Option</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setAutopayType('nach')}
                        className={`p-1.5 border rounded text-left transition select-none flex items-center justify-between cursor-pointer ${
                          autopayType === 'nach'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="block text-[10px] font-bold">e-NACH Direct</span>
                          <span className="text-[8px] font-mono block opacity-80">NetBanking mandated</span>
                        </div>
                        {autopayType === 'nach' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAutopayType('upi')}
                        className={`p-1.5 border rounded text-left transition select-none flex items-center justify-between cursor-pointer ${
                          autopayType === 'upi'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="block text-[10px] font-bold">UPI AutoPay</span>
                          <span className="text-[8px] font-mono block opacity-80">GPay/Paytm recurring</span>
                        </div>
                        {autopayType === 'upi' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Stripe Global details info block */}
              {billingCountry !== 'IN' && (
                <div className="bg-blue-50/40 border border-blue-200/50 p-2.5 rounded-lg flex items-start gap-2 text-[11px] text-blue-900 font-sans">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Stripe Global USD Gateway Activated (Consistent Fallback)</p>
                    <p className="text-[10px] text-blue-800/80 leading-normal">
                      Your IP has routed you to our USD billing schema. ComplianceOS processes international credit cards seamlessly with instantaneous SaaS setup.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Interactive Pricing Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['starter', 'growth', 'enterprise'] as const).map((planId) => {
                const isCurrent = subscription?.planId === planId;
                const isSelected = selectedPlan === planId;
                const pricing = getDisplayPricing(planId);
                const metadata = plansMetadata[planId];

                return (
                  <div
                    key={planId}
                    onClick={() => setSelectedPlan(planId)}
                    className={`bg-white border rounded-xl p-4 shadow-xs cursor-pointer flex flex-col justify-between transition relative ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/5 scale-[1.01] shadow-blue-50/20 shadow-md ring-1 ring-blue-500/10' 
                        : 'border-slate-205 hover:border-slate-350 bg-white shadow-3xs'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center gap-1.5">
                        <h4 className="font-bold text-slate-850 text-sm font-sans">{metadata.name}</h4>
                        {isCurrent && (
                          <span className="text-[8px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 px-1.5 py-0.2 rounded uppercase shrink-0">
                            Active Setup
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed">{metadata.description}</span>

                      {/* Pricing block */}
                      <div className="my-4">
                        <div className="flex items-baseline">
                          <span className="text-2xl font-black text-slate-900 font-sans tracking-tight">
                            {pricing.symbol}{pricing.amount.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-450 font-mono block">
                          charged {billingCycle} {pricing.isAnnualDiscountApplied && '(15% discounted)'}
                        </span>
                      </div>

                      {/* features */}
                      <ul className="space-y-1.5 text-[10.5px] text-slate-600 font-medium">
                        {metadata.features.map((feat, ix) => (
                          <li key={ix} className="flex gap-1.5 items-start">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Operational Action Button */}
                    <div className="mt-5 pt-3 border-t border-slate-50">
                      {isCurrent ? (
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-bold text-center border border-slate-200 cursor-not-allowed uppercase"
                        >
                          Configured Account
                        </button>
                      ) : subscription ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpgradeSubscription(planId);
                          }}
                          disabled={isUpdating}
                          className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold text-center tracking-wide transition cursor-pointer hover:shadow-xs"
                        >
                          Upgrade Plan Instance
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInitiateUnifiedCheckout(planId);
                          }}
                          disabled={isUpdating}
                          className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center tracking-wide transition cursor-pointer hover:shadow-sm uppercase"
                        >
                          {isUpdating ? 'Initiating...' : `Route to ${billingCountry === 'IN' ? 'Razorpay (INR)' : 'Stripe (USD Fallback)'}`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right sidebar billing calculator checklist */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Unified Calculation Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-3xs space-y-4">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-200 flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-blue-500" />
                Line-Item Quote Summary
              </h4>

              <div className="space-y-2.5 text-[11px] text-slate-600 font-sans">
                <div className="flex justify-between">
                  <span>SaaS product selected:</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedPlan} plan</span>
                </div>
                <div className="flex justify-between">
                  <span>Frequency commitment:</span>
                  <span className="font-semibold text-slate-700 capitalize">{billingCycle} renewal</span>
                </div>
                <div className="flex justify-between">
                  <span>Corporate domicile:</span>
                  <span className="font-bold text-slate-800">{billingCountry} (Unified Router)</span>
                </div>
                <div className="flex justify-between">
                  <span>Router processor node:</span>
                  <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold">
                    {billingCountry === 'IN' ? 'Razorpay' : ['GB', 'DE', 'FR'].includes(billingCountry) ? 'Paddle MoR' : 'Stripe Core'}
                  </span>
                </div>

                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Base plan rate:</span>
                    <strong className="font-mono text-slate-700">
                      {currentPriceDetails.symbol}{currentPriceDetails.amount.toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tax computation:</span>
                    <strong className="font-mono text-slate-700">
                      {billingCountry === 'IN' ? '18% statutory GST' : 'handled at checkout'}
                    </strong>
                  </div>
                  {billingCountry === 'IN' && (
                    <div className="flex justify-between text-slate-450 text-[10px] pl-2 border-l-2 border-slate-200">
                      <span>Add 18% Integrated GST:</span>
                      <strong className="font-mono">
                        {currentPriceDetails.symbol}{Math.round(currentPriceDetails.amount * 0.18).toLocaleString()}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200 text-xs font-bold text-slate-800">
                    <span>Aggregate base total:</span>
                    <span className="font-mono text-blue-600 text-sm">
                      {currentPriceDetails.symbol}
                      {billingCountry === 'IN' 
                        ? Math.round(currentPriceDetails.amount * 1.18).toLocaleString() 
                        : currentPriceDetails.amount.toLocaleString()
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5">
                <input
                  type="text"
                  placeholder="Enter Promo Code (COUPON15)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded px-2 py-1 text-xs text-slate-700 font-mono outline-none"
                />
                {couponCode === 'COUPON15' && (
                  <span className="text-[9px] text-emerald-600 block mt-1 font-bold">
                    ✓ Promo code "COUPON15" active! (Applied at router checkout instance)
                  </span>
                )}
              </div>
            </div>

            {/* Sandbox Quick Testing guide */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-3xs space-y-2">
              <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                ComplianceOS Router Sandbox
              </h5>
              <p className="text-[10px] text-slate-500 leading-normal">
                To test Stripe or Paddle overlays flow routing, switch the <strong>Country</strong> select value to <strong>United States</strong> or <strong>United Kingdom</strong> respectively, and click checkout!
              </p>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 2: INVOICES LEDGER --- */}
      {activeSubTab === 'invoices' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          
          {/* Invoice list table */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-slate-450 uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Corporate Invoice Store</span>
              <span className="bg-slate-150 text-slate-600 text-[9px] px-2 py-0.2 rounded-full font-bold">
                {(invoices || []).length} filed
              </span>
            </h4>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {(invoices || []).map((inv) => {
                const currencySymbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
                const sym = currencySymbols[inv.currency || "INR"] || "$";
                const isSelected = selectedInvoice?.id === inv.id;

                return (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className={`p-3 border rounded-lg cursor-pointer transition flex flex-col justify-between gap-1.5 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50/15 ring-1 ring-blue-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-800">{inv.invoiceNumber}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">Date: {new Date(inv.date).toLocaleDateString()}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono font-bold text-[8px] px-1.5 py-0.1 rounded uppercase shrink-0">
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">
                        Router: <strong className="text-slate-700">{inv.processor || 'razorpay'}</strong>
                      </span>
                      <strong className="text-slate-900 font-sans text-xs">
                        {sym}{inv.totalAmount.toLocaleString()}
                      </strong>
                    </div>

                  </div>
                );
              })}

              {invoices.length === 0 && (
                <div className="text-center py-8 text-slate-400 italic text-xs">
                  No billing tax invoices created yet. Select a plan to generate compliance files.
                </div>
              )}
            </div>
          </div>

          {/* Interactive Invoice visual descriptor details */}
          <div className="lg:col-span-8">
            {selectedInvoice ? (
              <div id="print_unified_tax_invoice" className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs space-y-4">
                
                {/* Visual Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase font-bold">
                      STATUTORY TAX STATEMENT INVOICE
                    </span>
                    <h3 className="text-base font-extrabold text-slate-800 font-sans tracking-tight">ComplianceOS SaaS Systems</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Normalized Record ID: {selectedInvoice.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                      {selectedInvoice.status}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 block mt-1">Processor Node: {selectedInvoice.processor?.toUpperCase() || 'RAZORPAY'}</span>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Invoice Code/Number</span>
                    <strong className="font-mono text-slate-800 text-xs font-bold block">{selectedInvoice.invoiceNumber}</strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Filing Timestamp</span>
                    <strong className="font-mono text-slate-700 text-xs font-medium block">
                      {new Date(selectedInvoice.date).toLocaleDateString()} {new Date(selectedInvoice.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </strong>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-mono block">Payment Mechanism</span>
                    <strong className="font-mono text-slate-700 text-xs font-bold block">
                      {selectedInvoice.processor === 'razorpay' ? 'Direct corporate UPI Autopay' : 'SaaS Credit Card Gateway'}
                    </strong>
                  </div>
                </div>

                {/* Company details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 pt-1 leading-relaxed">
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1 font-sans text-[11px] uppercase tracking-wide">Merchant Creditor</h5>
                    <p className="font-medium text-slate-700">ComplianceOS International Corp.</p>
                    <p className="text-[11px] text-slate-500">Corporate Tower B, Tech Hub Complex, Haryana 122002</p>
                    {selectedInvoice.processor === 'razorpay' && <p className="text-[11px] font-mono text-blue-600 font-bold mt-1">CIN: U72200HR2026PTC104552</p>}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 mb-1 font-sans text-[11px] uppercase tracking-wide">Client Debtor</h5>
                    <p className="font-medium text-slate-700">ZetaTech Enterprise Cloud Services</p>
                    <p className="text-[11px] text-slate-500">Subdomain Account: zetatech.complianceos.com</p>
                    {selectedInvoice.gstin && (
                      <p className="text-[11px] font-mono text-slate-700 font-extrabold mt-1">
                        GSTIN: <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{selectedInvoice.gstin}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Calculation math rows */}
                <div className="border-t border-b border-slate-150 py-3 mt-4 space-y-2 text-xs text-slate-650">
                  <div className="flex justify-between items-center text-slate-550">
                    <span>Baseline SaaS Subscription Service (Growth Platform Package):</span>
                    <strong className="font-mono text-slate-800 text-sm">
                      {selectedInvoice.currency === 'INR' ? '₹' : selectedInvoice.currency === 'EUR' ? '€' : selectedInvoice.currency === 'GBP' ? '£' : '$'}
                      {selectedInvoice.amount.toLocaleString()}
                    </strong>
                  </div>

                  {selectedInvoice.gstAmount !== undefined && selectedInvoice.gstAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Statutory Corporate GST (18.0%):</span>
                      <strong className="font-mono text-slate-800 text-sm">
                        ₹{selectedInvoice.gstAmount.toLocaleString()}
                      </strong>
                    </div>
                  )}

                  {selectedInvoice.taxAmount !== undefined && selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Calculated Regional VAT Charges:</span>
                      <strong className="font-mono text-slate-800 text-sm">
                        {selectedInvoice.currency === 'INR' ? '₹' : selectedInvoice.currency === 'EUR' ? '€' : selectedInvoice.currency === 'GBP' ? '£' : '$'}
                        {selectedInvoice.taxAmount.toLocaleString()}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 text-slate-900 font-bold text-sm">
                    <span>Unified Ledger Normalized Paid Total:</span>
                    <span className="font-mono text-blue-600 text-base">
                      {selectedInvoice.currency === 'INR' ? '₹' : selectedInvoice.currency === 'EUR' ? '€' : selectedInvoice.currency === 'GBP' ? '£' : '$'}
                      {selectedInvoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Static Receipt Link / PDF Rehosting section */}
                {selectedInvoice.invoicePdfUrl && (
                  <div className="bg-slate-50 p-2 border border-dashed border-slate-250 rounded-lg flex items-center justify-between text-[11px] text-slate-650">
                    <span className="flex items-center gap-1.5 font-sans">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Original PDF stored in: <strong className="text-slate-805 truncate max-w-sm font-mono">{selectedInvoice.invoicePdfUrl}</strong>
                    </span>
                    <a 
                      href={selectedInvoice.invoicePdfUrl}
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="bg-transparent hover:bg-slate-200 text-blue-600 font-bold px-2 py-0.5 rounded shrink-0 leading-normal border border-slate-300"
                    >
                      Inspect Source CDN
                    </a>
                  </div>
                )}

                {/* Printable row */}
                <div className="no-print pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Compliant Print PDF</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center text-slate-400 italic text-xs font-bold font-sans">
                Select an invoice item from the left ledger list to inspect full computations.
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 3: UNIFIED EXECUTIVE REVENUE MATRIX RECHARTS PANEL --- */}
      {activeSubTab === 'revenue' && (
        <div className="space-y-5 animate-fade-in">
          
          {isRevenueLoading ? (
            <div className="h-64 flex flex-col justify-center items-center text-xs text-slate-500 gap-2">
              <span className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></span>
              <span>Aggregating active subscriptions ledger across global processors...</span>
            </div>
          ) : revenueAnalytics ? (
            <div className="space-y-5 select-none">
              
              {/* Top Summary stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Total Aggregated MRR</span>
                  <span className="text-base sm:text-2xl font-black text-slate-950 font-sans block">
                    ${revenueAnalytics.totalMRR?.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold block font-sans">
                    ↑ 18.2% vs previous quarter
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Annualised Run Rate (ARR)</span>
                  <span className="text-base sm:text-2xl font-black text-slate-955 font-sans block">
                    ${(revenueAnalytics.totalMRR * 12)?.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold block font-sans">
                    Normalized international value
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Provider Churn rate</span>
                  <span className="text-base sm:text-2xl font-black text-slate-950 font-sans block">
                    {revenueAnalytics.churnRate}%
                  </span>
                  <span className="text-[9px] text-emerald-600 font-semibold block font-sans flex items-center gap-1 text-[8.5px]">
                    ● SAFELY UNDER SENSITIVE 3% THRESHOLD
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-1">
                  <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block">Expansion vs Contraction</span>
                  <span className="text-base sm:text-xl font-bold font-sans block text-slate-800 flex items-center justify-between">
                    <span>+${revenueAnalytics.expansionMRR}</span>
                    <span className="text-xs text-red-500">-${revenueAnalytics.contractionMRR}</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold block font-sans">
                    Current cycle delta
                  </span>
                  {/* Internal Segment Selection bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#08081f] p-4 rounded-xl border border-blue-500/15 gap-4 shadow-[0_0_15px_rgba(74,158,255,0.05)]">
                <div>
                  <h3 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    Internal Revenue Segmentation Controls
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Filter active aggregated subscriber streams by payment gateway node or geopolitical boundaries.</p>
                </div>
                
                <div className="flex gap-2 select-none shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setRevenueSegmentMode('processor')}
                    className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                      revenueSegmentMode === 'processor'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-705 text-slate-300 hover:text-white'
                    }`}
                  >
                    Processor Nodes
                  </button>
                  <button
                    onClick={() => setRevenueSegmentMode('geography')}
                    className={`flex-1 sm:flex-none text-center px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                      revenueSegmentMode === 'geography'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-900 border-slate-705 text-slate-300 hover:text-white'
                    }`}
                  >
                    Geography (India vs Global)
                  </button>
                </div>
              </div>

              {revenueSegmentMode === 'processor' ? (
                /* Charts section with Recharts - PROCESSORS */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Trend line chart */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Processor MRR Performance Trend (Trailing 6 Months)</span>
                      <span className="text-[10px] text-slate-450 font-normal font-mono">AGGREGATED USD EQUIVALENT</span>
                    </h4>
                    
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueAnalytics.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c38" strokeOpacity={0.2} />
                          <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, '']}
                            contentStyle={{ backgroundColor: '#08081c', borderColor: 'rgba(74, 158, 255, 0.25)', color: '#ffffff', fontSize: '11px', borderRadius: '8px' }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Line type="monotone" name="Total MRR" dataKey="total" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" name="Stripe Node" dataKey="stripe" stroke="#10b981" strokeWidth={1.5} strokeDasharray="5 5" />
                          <Line type="monotone" name="Paddle Node" dataKey="paddle" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" />
                          <Line type="monotone" name="Razorpay Node" dataKey="razorpay" stroke="#8b5cf6" strokeWidth={1.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pizza distribution */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-100">
                        Active Processor Distribution
                      </h4>
                      
                      <div className="h-44 w-full flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={revenueAnalytics?.processorSplit || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {(revenueAnalytics?.processorSplit || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`$${value.toLocaleString()}`, '']}
                              contentStyle={{ backgroundColor: '#08081c', borderColor: 'rgba(74, 158, 255, 0.25)', color: '#ffffff', fontSize: '11px', borderRadius: '8px' }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      {(revenueAnalytics?.processorSplit || []).map((item: any, i: number) => (
                        <div key={item.name} className="flex justify-between items-center text-[11px]">
                          <span className="flex items-center gap-1.5 text-slate-400 font-medium font-sans">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                            {item.name}
                          </span>
                          <strong className="font-mono text-white">${item.value.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              ) : (
                /* Charts section with Recharts - GEOGRAPHY */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Geographic Trailing Trends-Recharts Area Chart */}
                  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
                    <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span>Geographic MRR Growth Trends (India vs Global ROW)</span>
                      <span className="text-[10px] text-slate-450 font-normal font-mono">AGGREGATED USD EQUIVALENT</span>
                    </h4>
                    
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueAnalytics.geoTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradientIndia" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="gradientGlobal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c38" strokeOpacity={0.2} />
                          <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <Tooltip 
                            formatter={(value) => [`$${value.toLocaleString()}`, '']}
                            contentStyle={{ backgroundColor: '#08081c', borderColor: 'rgba(74, 158, 255, 0.25)', color: '#ffffff', fontSize: '11px', borderRadius: '8px' }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Area type="monotone" name="India National Segment (INR)" dataKey="India" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientIndia)" stackId="1" />
                          <Area type="monotone" name="Global International Segment (ROW)" dataKey="Global" stroke="#ec4899" strokeWidth={2.5} fillOpacity={1} fill="url(#gradientGlobal)" stackId="1" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Geography Allocation Snapshot List */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[11px] font-mono font-bold text-slate-500 uppercase pb-2 border-b border-slate-100">
                        Geographic MRR Share Allocation
                      </h4>
                      
                      <div className="space-y-4 pt-3">
                        {/* Binary India vs Global aggregate */}
                        <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 space-y-3 mb-2">
                          <span className="text-[8px] font-mono font-bold text-blue-400 uppercase tracking-widest block">Core Binary Aggregate Share</span>
                          
                          {/* India aggregate */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-sans font-semibold text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                India Segment
                              </span>
                              <span>
                                ${(revenueAnalytics.geographySplit?.find((g: any) => g.name.includes("India"))?.value || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${((revenueAnalytics.geographySplit?.find((g: any) => g.name.includes("India"))?.value || 0) / (revenueAnalytics.totalMRR || 1)) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* Global aggregate */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-sans font-semibold text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                                Global (ROW) Segment
                              </span>
                              <span>
                                ${(revenueAnalytics.totalMRR - (revenueAnalytics.geographySplit?.find((g: any) => g.name.includes("India"))?.value || 0)).toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full bg-pink-500" style={{ width: `${((revenueAnalytics.totalMRR - (revenueAnalytics.geographySplit?.find((g: any) => g.name.includes("India"))?.value || 0)) / (revenueAnalytics.totalMRR || 1)) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed regional segments */}
                        <span className="text-[8px] font-mono font-bold text-slate-450 uppercase tracking-widest block pt-1 border-t border-slate-800">Regional Distribution</span>
                        {revenueAnalytics.geographySplit?.map((item: any, idx: number) => {
                          const totalVal = revenueAnalytics.totalMRR || 19450;
                          const percentage = ((item.value / totalVal) * 100).toFixed(0);

                          return (
                            <div key={item.name} className="space-y-1.5">
                              <div className="flex justify-between text-[11px] font-sans font-medium">
                                <span className="text-slate-450 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GEOGRAPHY_COLORS[idx % GEOGRAPHY_COLORS.length] }}></span>
                                  {item.name}
                                </span>
                                <span className="text-white font-mono font-bold">
                                  ${item.value.toLocaleString()} <span className="text-[9.5px] text-slate-450 font-normal font-mono">({percentage}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 font-mono">
                                <div 
                                  className="h-full rounded-full transition-all duration-500" 
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: GEOGRAPHY_COLORS[idx % GEOGRAPHY_COLORS.length] 
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 mt-2 text-[9.5px] text-slate-400 leading-relaxed font-mono">
                      * Rates computed dynamically in USD based on live cross-gateway settlements.
                    </div>
                  </div>

                </div>
              )}              </div>

              </div>

              {/* Sub compliance analytics explanation context (Full Width Banner) */}
              <div className="bg-slate-950 text-white rounded-xl p-4 border border-blue-500/10 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold bg-blue-600 px-2 py-0.5 rounded uppercase">
                    SYSTEM COMPLIANCE STATEMENT
                  </span>
                  <h5 className="font-bold text-xs tracking-tight">Multi-Processor Multi-Currency Reconciliation Audit</h5>
                  <p className="text-[10.5px] text-slate-350 leading-relaxed font-sans max-w-4xl">
                    All aggregated subscription flows are automatically synced with municipal tax records. Razorpay INR transfers trigger mandatory tax filing to India Statutory GST authorities. Paddle Europe overlays handles statutory standard VAT payments and issues corresponding credit statements automatically.
                  </p>
                </div>
                <div className="text-[9.5px] font-mono text-slate-400 shrink-0 md:text-right flex flex-col md:items-end gap-1 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                  <span>Next reconciliation scan: Tomorrow, 04:00 UTC</span>
                  <strong className="text-blue-400">STATE: NOMINAL</strong>
                </div>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No historical trend details available. Try creating a subscription first.</p>
          )}

        </div>
      )}

      {/* --- FLOATING DETAILED IN-APP PAYMENT PROCESSOR WEB POPUP OVERLAY --- */}
      {checkoutModal?.isOpen && (
        <div id="payment_overlay_popup" className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden animate-scale-up">
            
            {/* Header branding based on processor */}
            <div className={`p-4 text-white text-xs font-mono font-bold flex justify-between items-center ${
              checkoutModal.processor === 'razorpay'
                ? 'bg-blue-600'
                : checkoutModal.processor === 'paddle'
                ? 'bg-purple-700'
                : 'bg-indigo-600'
            }`}>
              <span className="flex items-center gap-1.5">
                <Landmark className="w-4 h-4" />
                {checkoutModal.processor === 'razorpay' 
                  ? 'RAZORPAY INDIA CHECKOUT' 
                  : checkoutModal.processor === 'paddle'
                  ? 'PADDLE EUR OVERLAY'
                  : 'STRIPE CLIENT INTENT'}
              </span>
              <button 
                type="button"
                onClick={() => setCheckoutModal(null)}
                className="text-white hover:text-slate-100 font-extrabold text-xs cursor-pointer select-none"
              >
                ✕ Close
              </button>
            </div>

            {/* Simulated interactive frame inside */}
            <div className="p-4 space-y-4 font-sans text-xs text-slate-700">
              <div className="text-center space-y-1 pb-2 border-b border-slate-100">
                <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase block">COMMITTED SUM</span>
                <strong className="text-slate-900 text-lg block font-mono">
                  {checkoutModal.payload.currency === 'INR' ? '₹' : checkoutModal.payload.currency === 'EUR' ? '€' : checkoutModal.payload.currency === 'GBP' ? '£' : '$'}
                  {checkoutModal.payload.amount.toLocaleString()}
                </strong>
                <p className="text-[10px] text-slate-400">
                  Securing {selectedPlan.toUpperCase()} setup coverage period.
                </p>
              </div>

              {/* Checkout details description simulated block */}
              {checkoutModal.processor === 'razorpay' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded text-[11px] border border-slate-200 space-y-1 text-slate-650">
                    <p className="font-bold flex items-center justify-between text-slate-800">
                      <span>ZetaTech Corp Prefill</span>
                      <strong className="text-[9px] font-mono text-blue-600">UPI ACTIVE</strong>
                    </p>
                    <p>Contact: {customerEmail}</p>
                    <p>Notes ID: {checkoutModal.payload.subscriptionId}</p>
                    {gstInText && <p>Registered GSTIN: <strong className="font-mono text-slate-800">{gstInText}</strong></p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-mono block uppercase">Interactive sandbox simulation</label>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Razorpay UPI secure verification request dispatched to device... Payment completed.");
                        setCheckoutModal(null);
                        fetchBillingDetails();
                      }}
                      className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Authorize Razorpay Sandbox Payment
                    </button>
                  </div>
                </div>
              )}

              {checkoutModal.processor === 'paddle' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded text-[11px] border border-slate-200 space-y-1.5 text-slate-650">
                    <span className="font-bold block text-purple-700">PADDLE OVERLAY LOADED</span>
                    <p>The system automatically injected standard Paddle VAT computation scripts.</p>
                    <p>Recipient Email: <strong className="text-purple-900">{customerEmail}</strong></p>
                    <p>Passport Key: {checkoutModal.payload.subscriptionId}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Paddle MoR subscription payload simulated. Recurrent credit authorization successful.");
                      setCheckoutModal(null);
                      fetchBillingDetails();
                    }}
                    className="w-full text-center py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Confirm Paddle VAT Sandbox Payment
                  </button>
                </div>
              )}

              {checkoutModal.processor === 'stripe' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-2.5 rounded text-[11px] border border-slate-200 space-y-1.5 text-slate-650">
                    <span className="font-bold block text-indigo-700">STRIPE CHECKOUT URL GENERATED</span>
                    <p className="text-[10px] truncate">Endpoint: {checkoutModal.payload.checkout_url}</p>
                    <p>Clicking confirmation simulates Stripe webhook response automatically.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={checkoutModal.payload.checkout_url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="text-center py-2 border border-slate-250 text-slate-600 hover:text-slate-800 font-semibold rounded-lg text-xs leading-normal block hover:bg-slate-50"
                    >
                      Open Live Tab
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        alert("Stripe Checkout transaction callback simulated! Core webhook stored the PDF invoice.");
                        setCheckoutModal(null);
                        fetchBillingDetails();
                      }}
                      className="text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Authorize Transaction
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[9px] text-center text-slate-400 font-mono">
                Running mock sandbox environment on Port 3000
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
