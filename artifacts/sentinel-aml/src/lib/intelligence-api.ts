export async function intelligenceFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed");
  return payload as T;
}

export type Bank = { id: string; name: string; bankCode: string; country: string; status: string };
export type Mule = {
  id: string; anonymousId: string; bank: string; identity: string; score: number; status: string;
  incomingCount: number; outgoingCount: number; counterpartyCount: number;
  receivedAmount: number; sentAmount: number; passThroughPercentage: number;
  crossBank: boolean; reasons: string[];
};
export type CrossBankNetwork = {
  stats: { banksInvolved: number; accountsInvolved: number; crossBankTransactions: number; potentialMules: number; networkRiskScore: number };
  reasons: string[];
  banks: Bank[];
  nodes: { id: string; internalId: string; bank: string; bankCode?: string; identity: string; riskScore: number; riskLevel: string }[];
  edges: { id: string; source?: string; target?: string; amount: number; currency: string; timestamp: string; flagged: boolean }[];
};
export type Investigation = {
  id: string; caseNumber: string; title: string; description: string; status: string; severity: string;
  networkRiskScore: number; muleRiskScore: number; createdAt: string; updatedAt: string; createdByName?: string;
};
export type DisclosureRequest = {
  id: string; investigationId: string; anonymousEntityId: string; reason: string; status: string;
  owningBank: string; requestingUser: string; decisionComment?: string; createdAt: string;
};