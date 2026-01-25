import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcSigner, Eip1193Provider } from 'ethers';

interface Web3ContextType {
    account: string | null;
    provider: BrowserProvider | null;
    signer: JsonRpcSigner | null;
    connectWallet: () => Promise<void>;
    chainId: number | null;
    isConnecting: boolean;
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
            alert("Please install MetaMask!");
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
            console.error("Failed to connect wallet:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            // Auto-connect if already authorized
            const _provider = new BrowserProvider(window.ethereum as Eip1193Provider);
            _provider.listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    connectWallet();
                }
            });

            // Listen for account changes
            (window.ethereum as any).on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    // Re-instantiate signer
                    connectWallet();
                } else {
                    setAccount(null);
                    setSigner(null);
                }
            });
        }
    }, []);

    return (
        <Web3Context.Provider value={{ account, provider, signer, connectWallet, chainId, isConnecting }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
