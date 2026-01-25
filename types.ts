export interface Stream {
  id: string;
  sender: string;
  tokenSymbol: string;
  totalAmount: number;
  withdrawnAmount: number;
  remainingAmount: number;
  startTime: number;
  endTime: number;
  avatarUrl: string;
}

export interface Pool {
  id: string;
  pair: string;
  chain: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
}

export interface Investment {
  poolId: string;
  amountInvested: number;
  currentValue: number;
  feesEarned: number;
}

export enum AppView {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD'
}

export type StrategyType = 'LP' | 'SWAP';

export interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
}