/**
 * API utilities for pool management
 */

export interface Pool {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  raisedAmount: number;
  status: "active" | "closed" | "archived";
  createdAt: string;
  endDate: string;
}

export interface ArchiveResponse {
  success: boolean;
  poolId: string;
  status: string;
  message: string;
  archivedAt: string;
}

/**
 * Archives a single pool
 * @param poolId - The ID of the pool to archive
 * @returns Promise resolving to the archive response
 */
export async function archivePool(poolId: string): Promise<ArchiveResponse> {
  const response = await fetch(`/api/pools/${poolId}/archive`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to archive pool ${poolId}`);
  }
  
  return response.json();
}

/**
 * Archives multiple pools in parallel
 * @param poolIds - Array of pool IDs to archive
 * @returns Promise resolving to array of archive responses
 */
export async function archiveMultiplePools(poolIds: string[]): Promise<ArchiveResponse[]> {
  const archivePromises = poolIds.map(poolId => archivePool(poolId));
  return Promise.all(archivePromises);
}

/**
 * Fetches pools for a user (mock implementation)
 * Replace this with actual API call when backend is ready
 */
export async function fetchUserPools(): Promise<Pool[]> {
  // Mock data - replace with actual API call
  const mockPools: Pool[] = [
    {
      id: "1",
      title: "Help Local School",
      description: "Fundraising for new computers",
      targetAmount: 5000,
      raisedAmount: 3500,
      status: "active",
      createdAt: "2024-01-15",
      endDate: "2024-02-15"
    },
    {
      id: "2",
      title: "Medical Emergency Fund",
      description: "Support for medical expenses",
      targetAmount: 10000,
      raisedAmount: 8500,
      status: "active",
      createdAt: "2024-01-10",
      endDate: "2024-02-10"
    },
    {
      id: "3",
      title: "Community Garden",
      description: "Build a community garden",
      targetAmount: 2000,
      raisedAmount: 2000,
      status: "closed",
      createdAt: "2024-01-01",
      endDate: "2024-01-31"
    }
  ];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return mockPools;
}