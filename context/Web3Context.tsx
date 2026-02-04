import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, Eip1193Provider, Contract, parseUnits, keccak256, AbiCoder } from 'ethers';

// Contract addresses (Sepolia)
const FLOWSTATE_HOOK_ADDRESS = import.meta.env.VITE_FLOWSTATE_HOOK_ADDRESS || '0xb5f4c4286c77695577f0aB434487d58969BF8880';
const SABLIER_FLOW_ADDRESS = import.meta.env.VITE_SABLIER_FLOW_ADDRESS || '0xde489096eC9C718358c52a8BBe4ffD74857356e9';

// Minimal ABIs
const SABLIER_FLOW_ABI = [
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) external view returns (bool)',
    'function getApproved(uint256 streamId) external view returns (address)',
    'function approve(address to, uint256 streamId) external',
    'function withdrawableAmountOf(uint256 streamId) external view returns (uint128)',
    'function getRecipient(uint256 streamId) external view returns (address)',
    'function statusOf(uint256 streamId) external view returns (uint8)'
];

const FLOWSTATE_HOOK_ABI = [
    'function domainSeparator() external view returns (bytes32)',
    'function isIntentExecuted(bytes32 intentHash) external view returns (bool)'
];

// EIP-712 types for signing intents
const INTENT_TYPES = {
    Intent: [
        { name: 'user', type: 'address' },
        { name: 'streamId', type: 'uint256' },
        { name: 'amount', type: 'uint128' },
        { name: 'minBlock', type: 'uint256' },
        { name: 'maxBlock', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'isSwap', type: 'bool' },
        { name: 'poolKeyHash', type: 'bytes32' }
    ]
};

interface PoolKey {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
}

interface Intent {
    user: string;
    streamId: bigint;
    amount: bigint;
    minBlock: bigint;
    maxBlock: bigint;
    nonce: bigint;
    isSwap: boolean;
    targetPool: PoolKey;
}

interface Web3ContextType {
    account: string | null;
    provider: BrowserProvider | null;
    signer: JsonRpcSigner | null;
    connectWallet: () => Promise<void>;
    chainId: number | null;
    isConnecting: boolean;
    // Sablier functions
    approveSablierOperator: () => Promise<boolean>;
    checkSablierApproval: () => Promise<boolean>;
    getWithdrawableAmount: (streamId: number) => Promise<bigint>;
    // Intent signing
    signIntent: (intent: Intent) => Promise<string>;
    submitIntentToBackend: (intent: Intent, signature: string) => Promise<boolean>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [account, setAccount] = useState<string | null>(null);
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        try {
            setIsConnecting(true);
            const _provider = new BrowserProvider(window.ethereum as Eip1193Provider);
            const _signer = await _provider.getSigner();
            const _account = await _signer.getAddress();
            const _network = await _provider.getNetwork();

            setProvider(_provider);
            setSigner(_signer);
            setAccount(_account);
            setChainId(Number(_network.chainId));
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    // Approve FlowStateHook as operator for all Sablier streams
    const approveSablierOperator = async (): Promise<boolean> => {
        if (!signer) return false;

        try {
            const sablierContract = new Contract(SABLIER_FLOW_ADDRESS, SABLIER_FLOW_ABI, signer);
            const tx = await sablierContract.setApprovalForAll(FLOWSTATE_HOOK_ADDRESS, true);
            await tx.wait();
            console.log('Sablier operator approval confirmed');
            return true;
        } catch (error) {
            console.error('Failed to approve Sablier operator:', error);
            return false;
        }
    };

    // Check if FlowStateHook is already approved
    const checkSablierApproval = async (): Promise<boolean> => {
        if (!signer || !account) return false;

        try {
            const sablierContract = new Contract(SABLIER_FLOW_ADDRESS, SABLIER_FLOW_ABI, signer);
            return await sablierContract.isApprovedForAll(account, FLOWSTATE_HOOK_ADDRESS);
        } catch (error) {
            console.error('Failed to check Sablier approval:', error);
            return false;
        }
    };

    // Get withdrawable amount from a stream
    const getWithdrawableAmount = async (streamId: number): Promise<bigint> => {
        if (!provider) return 0n;

        try {
            const sablierContract = new Contract(SABLIER_FLOW_ADDRESS, SABLIER_FLOW_ABI, provider);
            return await sablierContract.withdrawableAmountOf(streamId);
        } catch (error) {
            console.error('Failed to get withdrawable amount:', error);
            return 0n;
        }
    };

    // Sign an EIP-712 intent for DCA execution
    const signIntent = async (intent: Intent): Promise<string> => {
        if (!signer || !chainId) throw new Error('Wallet not connected');

        const domain = {
            name: 'FlowState',
            version: '1',
            chainId: chainId,
            verifyingContract: FLOWSTATE_HOOK_ADDRESS
        };

        // Hash the pool key for the intent
        const poolKeyHash = hashPoolKey(intent.targetPool);

        const value = {
            user: intent.user,
            streamId: intent.streamId.toString(),
            amount: intent.amount.toString(),
            minBlock: intent.minBlock.toString(),
            maxBlock: intent.maxBlock.toString(),
            nonce: intent.nonce.toString(),
            isSwap: intent.isSwap,
            poolKeyHash: poolKeyHash
        };

        const signature = await signer.signTypedData(domain, INTENT_TYPES, value);
        return signature;
    };

    // Submit signed intent to backend relayer
    const submitIntentToBackend = async (intent: Intent, signature: string): Promise<boolean> => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        try {
            const response = await fetch(`${API_BASE_URL}/api/intents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user: intent.user,
                    streamId: intent.streamId.toString(),
                    amount: intent.amount.toString(),
                    minBlock: intent.minBlock.toString(),
                    maxBlock: intent.maxBlock.toString(),
                    nonce: intent.nonce.toString(),
                    isSwap: intent.isSwap,
                    targetPool: intent.targetPool,
                    signature: signature
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to submit intent:', error);
            return false;
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            const _provider = new BrowserProvider(window.ethereum as Eip1193Provider);
            _provider.listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    connectWallet();
                }
            });

            (window.ethereum as any).on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    connectWallet();
                } else {
                    setAccount(null);
                    setSigner(null);
                }
            });
        }
    }, []);

    return (
        <Web3Context.Provider
            value={{
                account,
                provider,
                signer,
                connectWallet,
                chainId,
                isConnecting,
                approveSablierOperator,
                checkSablierApproval,
                getWithdrawableAmount,
                signIntent,
                submitIntentToBackend
            }}
        >
            {children}
        </Web3Context.Provider>
    );
};

// Helper to hash a PoolKey for intent signing
function hashPoolKey(poolKey: PoolKey): string {
    const abiCoder = AbiCoder.defaultAbiCoder();
    return keccak256(
        abiCoder.encode(
            ['address', 'address', 'uint24', 'int24', 'address'],
            [poolKey.currency0, poolKey.currency1, poolKey.fee, poolKey.tickSpacing, poolKey.hooks]
        )
    );
}

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
