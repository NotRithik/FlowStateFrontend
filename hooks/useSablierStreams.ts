import { useState, useEffect, useRef } from 'react';
import { Contract, formatUnits } from 'ethers';
import { useWeb3 } from '../context/Web3Context';

// Sablier Flow contract address on Sepolia
const SABLIER_FLOW_ADDRESS = '0xde489096eC9C718358c52a8BBe4ffD74857356e9';

// Extended ABI for fetching stream data
const SABLIER_FLOW_ABI = [
    'function nextStreamId() external view returns (uint256)',
    'function getStream(uint256 streamId) external view returns (tuple(uint128 balance, uint128 ratePerSecond, address sender, uint40 snapshotTime, bool isStream, bool isTransferable, bool isVoided, address token, uint8 tokenDecimals, uint256 snapshotDebtScaled))',
    'function getRecipient(uint256 streamId) external view returns (address)',
    'function getToken(uint256 streamId) external view returns (address)',
    'function withdrawableAmountOf(uint256 streamId) external view returns (uint128)',
    'function statusOf(uint256 streamId) external view returns (uint8)',
    'function getBalance(uint256 streamId) external view returns (uint128)',
    'function getRatePerSecond(uint256 streamId) external view returns (uint128)',
];

// ERC20 ABI for token info
const ERC20_ABI = [
    'function symbol() external view returns (string)',
    'function decimals() external view returns (uint8)',
];

// Cache key for localStorage
const CACHE_KEY = 'flowstate_streams_cache';

// Sablier Flow uses 18 decimals for rate calculations (UD21x18 fixed point)
const SABLIER_RATE_DECIMALS = 18;

// Status enum matching Sablier Flow
export enum StreamStatus {
    PENDING = 0,
    STREAMING_SOLVENT = 1,
    STREAMING_INSOLVENT = 2,
    PAUSED_SOLVENT = 3,
    PAUSED_INSOLVENT = 4,
    VOIDED = 5,
}

export interface SablierStream {
    id: number;
    sender: string;
    recipient: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
    balance: bigint;
    ratePerSecond: bigint;          // Raw rate in 18-decimal fixed point
    withdrawableAmount: bigint;
    totalDebt: bigint;
    status: StreamStatus;
    isVoided: boolean;
    formattedBalance: string;
    formattedWithdrawable: string;
    formattedRatePerSecond: string; // Rate formatted as tokens/second (human-readable)
    monthlyRate: number;            // Convenience: tokens/month as a number
}

// Serialize stream for localStorage
function serializeStream(stream: SablierStream): any {
    return {
        ...stream,
        balance: stream.balance.toString(),
        ratePerSecond: stream.ratePerSecond.toString(),
        withdrawableAmount: stream.withdrawableAmount.toString(),
        totalDebt: stream.totalDebt.toString(),
    };
}

// Deserialize stream from localStorage
function deserializeStream(data: any): SablierStream {
    return {
        ...data,
        balance: BigInt(data.balance),
        ratePerSecond: BigInt(data.ratePerSecond),
        withdrawableAmount: BigInt(data.withdrawableAmount),
        totalDebt: BigInt(data.totalDebt),
    };
}

/**
 * Convert Sablier Flow's 18-decimal rate to human-readable tokens per second.
 * Sablier stores ratePerSecond as a UD21x18 (18 decimals, unsigned).
 * Example: If rate is 3.21e+15 (raw), that means 0.00321 tokens/second.
 */
function formatRatePerSecond(rawRate: bigint): string {
    // Sablier rate is stored with 18 decimals
    return formatUnits(rawRate, SABLIER_RATE_DECIMALS);
}

/**
 * Calculate monthly rate from the raw 18-decimal rate
 * Returns a human-readable number of tokens per month
 */
function calculateMonthlyRateFromRaw(rawRate: bigint): number {
    const SECONDS_PER_MONTH = 30n * 24n * 60n * 60n; // 2,592,000 seconds
    const monthlyRaw = rawRate * SECONDS_PER_MONTH;
    // Format with 18 decimals then parse to get the actual number
    const formatted = formatUnits(monthlyRaw, SABLIER_RATE_DECIMALS);
    return parseFloat(formatted);
}

export function useSablierStreams() {
    const { provider, account } = useWeb3();
    const [streams, setStreams] = useState<SablierStream[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    const providerRef = useRef(provider);
    const accountRef = useRef(account);

    useEffect(() => {
        providerRef.current = provider;
        accountRef.current = account;
    }, [provider, account]);

    const fetchStreams = async (forceRefresh = false) => {
        const currentProvider = providerRef.current;
        const currentAccount = accountRef.current;

        console.log('[useSablierStreams] fetchStreams called, account:', currentAccount);

        if (!currentProvider || !currentAccount) {
            setStreams([]);
            setInitialLoadDone(true);
            return;
        }

        // Try to load from cache first (instant load)
        if (!forceRefresh) {
            const cached = loadFromCache(currentAccount);
            if (cached && cached.length > 0) {
                console.log('[useSablierStreams] Loaded from cache:', cached.length, 'streams');
                setStreams(cached);
                setInitialLoadDone(true);
                // Refresh in background
                setTimeout(() => fetchStreams(true), 100);
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            console.log('[useSablierStreams] Scanning on-chain (newest to oldest)...');
            const streamIds = await scanOnChainFast(currentProvider, currentAccount);

            if (streamIds.length === 0) {
                console.log('[useSablierStreams] No streams found');
                setStreams([]);
                saveToCache(currentAccount, []);
                setInitialLoadDone(true);
                setLoading(false);
                return;
            }

            console.log('[useSablierStreams] Found stream IDs:', streamIds.map(s => s.id));

            const sablierContract = new Contract(SABLIER_FLOW_ADDRESS, SABLIER_FLOW_ABI, currentProvider);
            const userStreams: SablierStream[] = [];
            const tokenCache: Record<string, { symbol: string; decimals: number }> = {};

            // Fetch all stream details in parallel
            const streamPromises = streamIds.map(async (streamId) => {
                try {
                    const [streamData, withdrawable, status, balance, ratePerSecond] = await Promise.all([
                        sablierContract.getStream(streamId.id),
                        sablierContract.withdrawableAmountOf(streamId.id),
                        sablierContract.statusOf(streamId.id),
                        sablierContract.getBalance(streamId.id),
                        sablierContract.getRatePerSecond(streamId.id),
                    ]);

                    const tokenAddress = streamId.tokenAddress || streamData.token;

                    if (!tokenCache[tokenAddress]) {
                        const tokenContract = new Contract(tokenAddress, ERC20_ABI, currentProvider);
                        const [symbol, decimals] = await Promise.all([
                            tokenContract.symbol(),
                            tokenContract.decimals(),
                        ]);
                        tokenCache[tokenAddress] = { symbol, decimals: Number(decimals) };
                    }

                    const { symbol, decimals } = tokenCache[tokenAddress];
                    const rawRate = BigInt(ratePerSecond);

                    return {
                        id: streamId.id,
                        sender: streamId.sender || streamData.sender,
                        recipient: currentAccount,
                        tokenAddress,
                        tokenSymbol: symbol,
                        tokenDecimals: decimals,
                        balance: BigInt(balance),
                        ratePerSecond: rawRate,
                        withdrawableAmount: BigInt(withdrawable),
                        totalDebt: 0n,
                        status: Number(status) as StreamStatus,
                        isVoided: streamData.isVoided,
                        formattedBalance: formatUnits(balance, decimals),
                        formattedWithdrawable: formatUnits(withdrawable, decimals),
                        formattedRatePerSecond: formatRatePerSecond(rawRate),
                        monthlyRate: calculateMonthlyRateFromRaw(rawRate),
                    } as SablierStream;
                } catch (e) {
                    console.error(`[useSablierStreams] Failed to fetch stream ${streamId.id}:`, e);
                    return null;
                }
            });

            const results = await Promise.all(streamPromises);
            const validStreams = results.filter((s): s is SablierStream => s !== null);

            console.log('[useSablierStreams] Total streams loaded:', validStreams.length);
            setStreams(validStreams);
            saveToCache(currentAccount, validStreams);
        } catch (e) {
            console.error('[useSablierStreams] Error:', e);
            setError('Failed to fetch streams');
        } finally {
            setLoading(false);
            setInitialLoadDone(true);
        }
    };

    useEffect(() => {
        if (account) {
            setInitialLoadDone(false);
            fetchStreams();
        } else {
            setStreams([]);
            setInitialLoadDone(true);
        }
    }, [account]);

    useEffect(() => {
        if (!account) return;
        const interval = setInterval(() => fetchStreams(true), 60000);
        return () => clearInterval(interval);
    }, [account]);

    return {
        streams,
        loading: loading && !initialLoadDone,
        error,
        refetch: () => fetchStreams(true),
        hasStreams: streams.length > 0,
    };
}

// Fast on-chain scan: starts from newest and scans in batches
async function scanOnChainFast(provider: any, account: string): Promise<Array<{ id: number; sender: string; tokenAddress: string }>> {
    console.log('[OnChain] Fast scan for:', account);

    const sablierContract = new Contract(SABLIER_FLOW_ADDRESS, SABLIER_FLOW_ABI, provider);
    const nextId = await sablierContract.nextStreamId();
    const totalStreams = Number(nextId);

    console.log('[OnChain] Total streams:', totalStreams);

    const foundStreams: Array<{ id: number; sender: string; tokenAddress: string }> = [];
    const BATCH_SIZE = 10;

    // Scan from NEWEST to OLDEST (most likely to find user's stream first)
    for (let start = totalStreams - 1; start >= 1; start -= BATCH_SIZE) {
        const end = Math.max(1, start - BATCH_SIZE + 1);
        const batchPromises: Promise<{ id: number; recipient: string; sender: string; tokenAddress: string } | null>[] = [];

        for (let i = start; i >= end; i--) {
            batchPromises.push(
                (async () => {
                    try {
                        const recipient = await sablierContract.getRecipient(i);
                        if (recipient.toLowerCase() === account.toLowerCase()) {
                            const [tokenAddress, streamData] = await Promise.all([
                                sablierContract.getToken(i),
                                sablierContract.getStream(i),
                            ]);
                            return { id: i, recipient, sender: streamData.sender, tokenAddress };
                        }
                        return null;
                    } catch {
                        return null;
                    }
                })()
            );
        }

        const results = await Promise.all(batchPromises);
        for (const r of results) {
            if (r) {
                console.log(`[OnChain] Found stream ${r.id}!`);
                foundStreams.push({ id: r.id, sender: r.sender, tokenAddress: r.tokenAddress });
            }
        }

        // If we found streams and checked a lot already, stop early
        // (assume user probably has recent streams)
        if (foundStreams.length > 0 && start < totalStreams - 50) {
            console.log('[OnChain] Found streams, stopping early');
            break;
        }
    }

    console.log('[OnChain] Total found:', foundStreams.length);
    return foundStreams;
}

// Cache helpers
function loadFromCache(account: string): SablierStream[] | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.account?.toLowerCase() !== account.toLowerCase()) return null;
        if (Date.now() - data.timestamp > 300000) return null; // 5 min TTL
        return data.streams.map(deserializeStream);
    } catch {
        return null;
    }
}

function saveToCache(account: string, streams: SablierStream[]) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            account,
            timestamp: Date.now(),
            streams: streams.map(serializeStream),
        }));
    } catch {
        // Ignore storage errors
    }
}

// Helper to format address
export function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper to calculate monthly rate from per-second rate (DEPRECATED - use stream.monthlyRate)
export function calculateMonthlyRate(ratePerSecond: bigint, _decimals: number): string {
    // ratePerSecond is stored with 18 decimals in Sablier Flow
    const SECONDS_PER_MONTH = 30n * 24n * 60n * 60n;
    const monthly = ratePerSecond * SECONDS_PER_MONTH;
    return formatUnits(monthly, SABLIER_RATE_DECIMALS);
}

// Helper to get status label
export function getStatusLabel(status: StreamStatus): string {
    const labels: Record<StreamStatus, string> = {
        [StreamStatus.PENDING]: 'Pending',
        [StreamStatus.STREAMING_SOLVENT]: 'Active',
        [StreamStatus.STREAMING_INSOLVENT]: 'Insolvent',
        [StreamStatus.PAUSED_SOLVENT]: 'Paused',
        [StreamStatus.PAUSED_INSOLVENT]: 'Paused (Insolvent)',
        [StreamStatus.VOIDED]: 'Voided',
    };
    return labels[status] || 'Unknown';
}
