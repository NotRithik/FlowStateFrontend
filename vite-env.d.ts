/// <reference types="vite/client" />

interface Window {
    ethereum?: {
        isMetaMask?: boolean;
        request?: (...args: any[]) => Promise<any>;
        on?: (event: string, callback: (...args: any[]) => void) => void;
        removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
}

interface ImportMetaEnv {
    readonly VITE_FLOWSTATE_HOOK_ADDRESS?: string;
    readonly VITE_SABLIER_FLOW_ADDRESS?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
