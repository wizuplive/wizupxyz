'use client';

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Profile</h1>
          <p className="text-sm lg:text-base text-white/50">Manage your personal details and public creator profile.</p>
        </div>
        <Button className="w-full sm:w-auto h-12 sm:h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
          Save changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          
          {/* Default Profile Card */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Personal details</h2>
            
            <div className="flex items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/10 shrink-0">
                <AvatarFallback className="bg-gradient-to-tr from-gray-800 to-gray-600 text-lg sm:text-xl text-white">SJ</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button variant="outline" size="sm" className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-10 sm:h-8 text-xs font-medium">
                  Change avatar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs text-white/70">Full name</Label>
                <Input id="fullName" defaultValue="Sarah Jenkins" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs text-white/70">Email address</Label>
                <Input id="email" defaultValue="sarah@wizup.app" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs text-white/70">Website</Label>
                <Input id="website" defaultValue="sarahjenkins.co" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs text-white/70">Location</Label>
                <Input id="location" defaultValue="Austin, TX" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-xs text-white/70">Bio</Label>
              <Textarea 
                id="bio" 
                defaultValue="Building practical digital products for busy creators." 
                className="bg-[#0A0A0B] border-white/10 text-sm min-h-[100px] resize-none" 
              />
            </div>
          </div>

          {/* Creator Profile Section */}
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Creator profile</h2>
            <div className="space-y-4 lg:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs text-white/70">Display name</Label>
                <Input id="displayName" defaultValue="Sarah Jenkins" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs text-white/70">Creator category</Label>
                  <Input id="category" defaultValue="Productivity" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="audience" className="text-xs text-white/70">Main audience</Label>
                  <Input id="audience" defaultValue="Freelancers" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus" className="text-xs text-white/70">Product focus</Label>
                <Input id="focus" defaultValue="Planners, templates, and simple systems" className="bg-[#0A0A0B] border-white/10 text-sm h-11 lg:h-10" />
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Column (1 column on large screens) */}
        <div className="space-y-4 lg:space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Account summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/50">Plan</span>
                <div className="inline-flex items-center rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70">
                  Pro Creator
                </div>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/50">Workspace</span>
                <span className="text-sm font-medium text-white/90">Personal</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/50">Joined</span>
                <span className="text-sm text-white/90">May 2026</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-white/50">Saved projects</span>
                <span className="text-sm font-medium text-white">12</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
