'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Billing</h1>
          <p className="text-sm lg:text-base text-white/50">Manage your plan, payment method, and invoices.</p>
        </div>
        <Button className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
          Manage plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          
          {/* Current plan card */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[15px] font-medium text-white mb-1">Current plan</h2>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2 sm:mt-4">$29<span className="text-sm font-normal text-white/50">/month</span></p>
              </div>
              <div className="inline-flex items-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] sm:text-xs font-semibold text-emerald-400">
                Pro Creator
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-8">
              <p className="text-sm text-white/70">Renews on June 4, 2026</p>
              <p className="text-sm text-white/70 flex items-center gap-2">
                Status: <span className="text-emerald-400 font-medium">Active</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-11 sm:h-10">
                Change plan
              </Button>
              <Button variant="ghost" className="w-full sm:w-auto text-white/50 hover:text-white hover:bg-white/5 h-11 sm:h-10">
                Cancel plan
              </Button>
            </div>
          </div>

          {/* Payment method card */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Payment method</h2>
            
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/5 bg-[#0A0A0B] mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-6 sm:h-8 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-white tracking-widest pl-1 pr-0.5">VISA</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-none mb-1">Visa ending in 4242</p>
                  <p className="text-[10px] sm:text-xs text-white/50">Expires 08/28</p>
                </div>
              </div>
            </div>
            
            <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-11 sm:h-10">
              Update payment method
            </Button>
          </div>

          {/* Invoices card */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-white/5">
              <h2 className="text-[15px] font-medium text-white">Invoices</h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Date</th>
                    <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Amount</th>
                    <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Status</th>
                    <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 lg:px-8 py-4 text-white/90">May 4, 2026</td>
                    <td className="px-6 lg:px-8 py-4 text-white/90">$29.00</td>
                    <td className="px-6 lg:px-8 py-4">
                      <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">Paid</span>
                    </td>
                    <td className="px-6 lg:px-8 py-4 text-right">
                      <button className="text-primary hover:text-primary/80 font-medium text-[13px] transition-colors">Download</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 lg:px-8 py-4 text-white/90">April 4, 2026</td>
                    <td className="px-6 lg:px-8 py-4 text-white/90">$29.00</td>
                    <td className="px-6 lg:px-8 py-4">
                      <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">Paid</span>
                    </td>
                    <td className="px-6 lg:px-8 py-4 text-right">
                      <button className="text-primary hover:text-primary/80 font-medium text-[13px] transition-colors">Download</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden flex flex-col divide-y divide-white/5">
              <div className="p-4 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="font-medium text-white text-sm">May 4, 2026</div>
                       <div className="text-white/70 text-sm mt-0.5">$29.00</div>
                    </div>
                    <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">Paid</span>
                 </div>
                 <Button variant="outline" size="sm" className="w-full border-white/10 text-white h-10 bg-white/5 font-medium">Download receipt</Button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="font-medium text-white text-sm">April 4, 2026</div>
                       <div className="text-white/70 text-sm mt-0.5">$29.00</div>
                    </div>
                    <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">Paid</span>
                 </div>
                 <Button variant="outline" size="sm" className="w-full border-white/10 text-white h-10 bg-white/5 font-medium">Download receipt</Button>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-4 lg:space-y-6">
          
          {/* Usage card */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Usage this month</h2>
            
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Ideas scanned</span>
                  <span className="text-xs font-medium text-white">14 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Products created</span>
                  <span className="text-xs font-medium text-white">3 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Sales kits created</span>
                  <span className="text-xs font-medium text-white">2 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-white/70">Store pages</span>
                  <span className="text-xs font-medium text-white">1 / <span className="text-white/40">5</span></span>
                </div>
                <Progress value={20} className="h-1.5 bg-white/10" />
              </div>
            </div>
          </div>

          {/* Upgrade section */}
          <div className="bg-gradient-to-b from-[#1A1A1E] to-[#121214] border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-white mb-2">Need more workspace power?</h3>
            <p className="text-xs text-white/50 mb-4 sm:mb-6 leading-relaxed">
              Upgrade to Studio for team features, more store pages, and advanced AI help.
            </p>
            <Button className="w-full bg-white hover:bg-white/90 text-black text-sm h-11 sm:h-9">
              View Studio plan
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
