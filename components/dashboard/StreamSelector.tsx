import React from 'react';
import { SablierStream, shortenAddress, getStatusLabel, StreamStatus } from '../../hooks/useSablierStreams';
import { SwissCard } from '../PixelComponents';
import { ChevronRight } from 'lucide-react';

interface StreamSelectorProps {
    streams: SablierStream[];
    selectedStream: SablierStream | null;
    onSelect: (stream: SablierStream) => void;
}

export const StreamSelector: React.FC<StreamSelectorProps> = ({
    streams,
    selectedStream,
    onSelect
}) => {
    return (
        <div className="mb-8">
            <h3 className="font-sans font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">
                Your Sablier Streams ({streams.length})
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {streams.map((stream) => {
                    const isSelected = selectedStream?.id === stream.id;
                    const isActive = stream.status === StreamStatus.STREAMING_SOLVENT;

                    return (
                        <button
                            key={stream.id}
                            onClick={() => onSelect(stream)}
                            className={`flex-shrink-0 text-left p-4 border transition-all ${isSelected
                                    ? 'border-swiss-red bg-swiss-red/5'
                                    : 'border-gray-200 bg-white hover:border-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-sm flex items-center justify-center text-white font-bold ${isActive ? 'bg-green-500' : 'bg-gray-400'
                                    }`}>
                                    {stream.tokenSymbol.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm">
                                        Stream #{stream.id}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {parseFloat(stream.formattedWithdrawable).toFixed(2)} {stream.tokenSymbol}
                                    </div>
                                </div>
                                <ChevronRight size={16} className={isSelected ? 'text-swiss-red' : 'text-gray-300'} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
