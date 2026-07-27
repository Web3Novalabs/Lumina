"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Checkbox } from "@/components/ui/checkbox";
import { Pool, fetchUserPools, archiveMultiplePools } from "@/lib/api/pools";

export default function DashboardOverviewPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPools, setSelectedPools] = useState<string[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPools = async () => {
      setLoading(true);
      try {
        const userPools = await fetchUserPools();
        setPools(userPools);
      } catch (error) {
        console.error("Failed to fetch pools:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPools();
  }, []);

  const handleSelectPool = (poolId: string, checked: boolean) => {
    setSelectedPools(prev => 
      checked 
        ? [...prev, poolId]
        : prev.filter(id => id !== poolId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const archivablePools = pools.filter(pool => pool.status !== "archived").map(pool => pool.id);
      setSelectedPools(archivablePools);
    } else {
      setSelectedPools([]);
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedPools.length === 0) return;
    
    setIsArchiving(true);
    try {
      // Archive selected pools using the centralized API utility
      await archiveMultiplePools(selectedPools);
      
      // Update local state to reflect archived pools
      setPools(prevPools => 
        prevPools.map(pool => 
          selectedPools.includes(pool.id) 
            ? { ...pool, status: "archived" as const }
            : pool
        )
      );
      
      // Clear selection and refresh the list
      setSelectedPools([]);
      
      console.log(`Successfully archived ${selectedPools.length} pools`);
    } catch (error) {
      console.error("Failed to archive selected pools:", error);
      // You might want to show a user-friendly error message here
    } finally {
      setIsArchiving(false);
    }
  };

  const activePools = pools.filter(pool => pool.status !== "archived");
  const isAllSelected = activePools.length > 0 && selectedPools.length === activePools.length;
  const isIndeterminate = selectedPools.length > 0 && selectedPools.length < activePools.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Overview
        </h1>
        <p className="mt-2 text-slate-400">
          Welcome to your Nevo dashboard. Track your pools and contributions here.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <DashboardStats />
          </section>
          
          {/* Pools Management Section */}
          <section className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">My Pools</h2>
              {selectedPools.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {selectedPools.length} selected
                  </span>
                  <button
                    onClick={handleArchiveSelected}
                    disabled={isArchiving}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isArchiving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive selected
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
              </div>
            ) : activePools.length > 0 ? (
              <div className="space-y-4">
                {/* Select All Checkbox */}
                <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                  <Checkbox
                    checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-slate-400">
                    Select all ({activePools.length})
                  </span>
                </div>

                {/* Pool List */}
                {activePools.map((pool) => (
                  <div
                    key={pool.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                      selectedPools.includes(pool.id)
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedPools.includes(pool.id)}
                      onCheckedChange={(checked) => handleSelectPool(pool.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{pool.title}</h3>
                      <p className="text-sm text-slate-400">{pool.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span>Target: ${pool.targetAmount.toLocaleString()}</span>
                        <span>Raised: ${pool.raisedAmount.toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          pool.status === "active" 
                            ? "bg-green-500/20 text-green-400" 
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {pool.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-500 mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white">No active pools</h3>
                <p className="mt-1 text-sm text-slate-500">Create your first pool to get started.</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-1 h-[400px]">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
