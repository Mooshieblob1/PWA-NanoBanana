/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateImageFromText, generateImageFromImageAndText } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { UploadIcon, HistoryIcon, XCircleIcon, DownloadIcon, ImageIcon, MagicWandIcon, PaletteIcon, ArrowsPointingOutIcon, RectangleGroupIcon } from './components/icons';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
const aspectRatios: { name: string, value: AspectRatio }[] = [
    { name: '1:1', value: '1:1' },
    { name: '16:9', value: '16:9' },
    { name: '9:16', value: '9:16' },
    { name: '4:3', value: '4:3' },
    { name: '3:4', value: '3:4' },
];

const filters = [
    { name: 'Vintage', prompt: 'Apply a vintage, retro film filter. Give it a warm, faded look with slight grain.' },
    { name: 'B&W', prompt: 'Convert this to a high-contrast, dramatic black and white.' },
    { name: 'Vibrant', prompt: 'Enhance the colors to be more vibrant and saturated. Make it pop.' },
    { name: 'Cinematic', prompt: 'Give this a cinematic look with teal and orange color grading.' },
];

type ControlPanelProps = {
    prompt: string;
    setPrompt: (value: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (value: AspectRatio) => void;
    isLoading: boolean;
    promptHistory: string[];
    uploadedImage: File | null;
    handleGenerate: () => void;
    isUploadPanelOpen: boolean;
    setIsUploadPanelOpen: (isOpen: boolean) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRemoveUploadedImage: () => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    uploadedImageUrl: string | null;
    activeImageUrl: string | null;
    editPrompt: string;
    setEditPrompt: (value: string) => void;
    handleEditWithPrompt: () => void;
    handleUpscale: () => void;
    handleApplyFilter: (filterPrompt: string) => void;
    handleChangeAspectRatio: (newAspectRatio: AspectRatio) => void;
};

const ControlPanel: React.FC<ControlPanelProps> = React.memo(({
    prompt, setPrompt, aspectRatio, setAspectRatio, isLoading, promptHistory, uploadedImage, handleGenerate,
    isUploadPanelOpen, setIsUploadPanelOpen, handleImageUpload, handleRemoveUploadedImage, fileInputRef,
    uploadedImageUrl, activeImageUrl, editPrompt, setEditPrompt, handleEditWithPrompt, handleUpscale,
    handleApplyFilter, handleChangeAspectRatio
}) => (
    <div className="w-full md:w-96 bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 flex flex-col gap-6 text-gray-200 shadow-2xl">
        <div className="flex flex-col gap-6">
            {/* Prompt Section */}
            <div className="flex flex-col gap-2 relative">
                <div className="flex justify-between items-center">
                    <label htmlFor="prompt" className="font-semibold text-gray-100 flex items-center gap-2">
                        <MagicWandIcon className="w-5 h-5" />
                        Prompt
                    </label>
                    <button 
                        type="button" 
                        onClick={() => setIsUploadPanelOpen(!isUploadPanelOpen)}
                        className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1"
                    >
                        <ImageIcon className="w-4 h-4"/>
                        {uploadedImage ? "Using Image" : "Add Image"}
                    </button>
                </div>
                <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerate();
                        }
                    }}
                    placeholder="A futuristic cityscape at sunset..."
                    rows={4}
                    className="bg-gray-900/70 border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition w-full resize-none placeholder:text-gray-500"
                    disabled={isLoading}
                />
                {isUploadPanelOpen && (
                    <div className="border border-dashed border-gray-600 rounded-lg p-4 mt-2 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        {uploadedImageUrl ? (
                            <div className="relative group">
                                <img src={uploadedImageUrl} alt="Uploaded preview" className="rounded-md max-h-32 mx-auto" />
                                <button
                                    onClick={handleRemoveUploadedImage}
                                    className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-black/80 transition"
                                    aria-label="Remove image"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors w-full"
                                disabled={isLoading}
                            >
                                <UploadIcon className="w-8 h-8" />
                                <span className="text-sm font-semibold">Click to upload an image</span>
                                <span className="text-xs">PNG, JPG, WEBP</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Aspect Ratio */}
            <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-100 flex items-center gap-2">
                    <RectangleGroupIcon className="w-5 h-5" />
                    Aspect Ratio
                </label>
                <div className="grid grid-cols-5 gap-2">
                    {aspectRatios.map(({ name, value }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setAspectRatio(value)}
                            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-yellow-500 ${
                                aspectRatio === value
                                    ? 'bg-yellow-500 text-gray-900 shadow-sm'
                                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt History */}
            {promptHistory.length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-100 flex items-center gap-2">
                        <HistoryIcon className="w-5 h-5" />
                        History
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {promptHistory.map((p, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(p)}
                                className="bg-gray-700/50 text-gray-300 hover:bg-gray-700 text-xs px-2 py-1 rounded-full transition-colors"
                            >
                                {p.length > 20 ? `${p.substring(0, 20)}...` : p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-6 pt-6 border-t border-gray-700/50">
            <button
                onClick={handleGenerate}
                disabled={isLoading || (!prompt.trim() && !uploadedImage)}
                className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-400 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/30"
            >
                {isLoading ? <Spinner /> : 'Generate'}
            </button>
            
            {/* Edit Panel */}
            <div className={`flex flex-col gap-4 transition-opacity duration-300 ${!activeImageUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="text-lg font-bold text-center border-t border-b border-gray-700/50 py-2 text-gray-300">Edit Image</h3>
                
                {/* Edit Prompt */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="edit-prompt" className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                       <MagicWandIcon className="w-4 h-4"/> Edit with Prompt
                    </label>
                    <div className="flex gap-2">
                        <input
                            id="edit-prompt"
                            type="text"
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleEditWithPrompt();
                                }
                            }}
                            placeholder="Add a hat to the person..."
                            className="flex-grow bg-gray-900/70 border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition w-full placeholder:text-gray-500"
                            disabled={isLoading || !activeImageUrl}
                        />
                        <button 
                            onClick={handleEditWithPrompt} 
                            disabled={isLoading || !activeImageUrl || !editPrompt.trim()}
                            className="bg-yellow-500/20 text-yellow-300 px-3 rounded-lg hover:bg-yellow-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            Apply
                        </button>
                    </div>
                </div>

                {/* Upscale */}
                 <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                       <ArrowsPointingOutIcon className="w-4 h-4"/> Upscale
                    </label>
                    <button 
                        onClick={handleUpscale} 
                        disabled={isLoading || !activeImageUrl}
                        className="w-full bg-gray-700/50 text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        Enhance Resolution
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                       <PaletteIcon className="w-4 h-4"/> Artistic Filters
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {filters.map(filter => (
                            <button 
                                key={filter.name}
                                onClick={() => handleApplyFilter(filter.prompt)} 
                                disabled={isLoading || !activeImageUrl}
                                className="bg-gray-700/50 text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {filter.name}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Change Aspect Ratio */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                       <RectangleGroupIcon className="w-4 h-4"/> Change Aspect Ratio
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                       {aspectRatios.map(({ value }) => (
                            <button
                                key={`edit-${value}`}
                                type="button"
                                onClick={() => handleChangeAspectRatio(value)}
                                disabled={isLoading || !activeImageUrl}
                                className="px-3 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-yellow-500 bg-gray-700/50 text-gray-300 hover:bg-gray-700 enabled:hover:bg-gray-600"
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
));

type CanvasProps = {
    isLoading: boolean;
    loadingMessage: string;
    error: string | null;
    setError: (error: string | null) => void;
    activeImageUrl: string | null;
    handleDownload: (imageUrl: string) => void;
};

const Canvas: React.FC<CanvasProps> = React.memo(({ isLoading, loadingMessage, error, setError, activeImageUrl, handleDownload }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative">
        {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
                <Spinner />
                <p className="mt-4 text-white text-lg font-semibold animate-pulse">{loadingMessage}</p>
            </div>
        )}
        
        {error && (
            <div className="absolute top-8 max-w-lg w-full bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg z-20" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                    <XCircleIcon className="w-6 h-6"/>
                </button>
            </div>
        )}

        <div className="w-full h-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center bg-gray-900/50 border border-dashed border-gray-700 rounded-2xl overflow-hidden">
            {activeImageUrl ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                    <img 
                        src={activeImageUrl} 
                        alt="Generated art" 
                        className="max-w-full max-h-[calc(100%-60px)] object-contain rounded-lg"
                    />
                    <button
                        onClick={() => handleDownload(activeImageUrl)}
                        className="mt-4 bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-yellow-500/30"
                    >
                       <DownloadIcon className="w-5 h-5"/> Download
                    </button>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    <ImageIcon className="w-24 h-24 mx-auto" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-400">Your creations will appear here</h2>
                    <p className="mt-2">Use the controls on the left to get started.</p>
                </div>
            )}
        </div>
    </div>
));


const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New states for editing
    const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState<string>('');
    const [loadingMessage, setLoadingMessage] = useState<string>('AI is creating...');
    const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);

    useEffect(() => {
        if (generatedImages.length > 0) {
            setActiveImageUrl(generatedImages[generatedImages.length - 1]);
        }
    }, [generatedImages]);

    const handleGenerate = async () => {
        if (!prompt.trim() && !uploadedImage) {
            setError('Please enter a prompt or upload an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        if (!promptHistory.includes(prompt) && prompt.trim()) {
            setPromptHistory([prompt, ...promptHistory].slice(0, 10));
        }

        try {
            let newImages: string[];
            if (uploadedImage) {
                setLoadingMessage('AI is editing...');
                const newImage = await generateImageFromImageAndText(uploadedImage, prompt);
                newImages = [newImage];
            } else {
                setLoadingMessage('AI is creating...');
                newImages = await generateImageFromText(prompt, aspectRatio);
            }
            setGeneratedImages(prev => [...prev, ...newImages]);
            setUploadedImage(null);
            setUploadedImageUrl(null);
            setIsUploadPanelOpen(false);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpscale = async () => {
        if (!activeImageUrl) {
            setError('No active image to upscale.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Upscaling image...');

        try {
            const upscalePrompt = "Upscale this image, increasing its resolution and enhancing details. Make it sharper and clearer without altering the content.";
            const newImage = await generateImageFromImageAndText(activeImageUrl, upscalePrompt);
            setActiveImageUrl(newImage);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyFilter = async (filterPrompt: string) => {
        if (!activeImageUrl) {
            setError('No active image to apply a filter to.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Applying filter...');

        try {
            const newImage = await generateImageFromImageAndText(activeImageUrl, filterPrompt);
            setActiveImageUrl(newImage);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditWithPrompt = async () => {
        if (!activeImageUrl) {
            setError('No active image to edit.');
            return;
        }
        if (!editPrompt.trim()) {
            setError('Please enter an edit instruction.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Applying your edit...');

        try {
            const newImage = await generateImageFromImageAndText(activeImageUrl, editPrompt);
            setActiveImageUrl(newImage);
            setEditPrompt('');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangeAspectRatio = async (newAspectRatio: AspectRatio) => {
        if (!activeImageUrl) {
            setError('No active image to edit.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Changing aspect ratio...');

        try {
            const editInstruction = `Render this image at a new aspect ratio of ${newAspectRatio}. Intelligently expand the scene and composition to fill the new dimensions. Do not crop, stretch, or distort the original subject.`;
            const newImage = await generateImageFromImageAndText(activeImageUrl, editInstruction);
            setActiveImageUrl(newImage);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedImage(file);
            setUploadedImageUrl(URL.createObjectURL(file));
        }
    };

    const handleRemoveUploadedImage = () => {
        setUploadedImage(null);
        setUploadedImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDownload = (imageUrl: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

    return (
        <div className="min-h-screen bg-transparent text-white flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-8">
                <ControlPanel
                    prompt={prompt}
                    setPrompt={setPrompt}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    isLoading={isLoading}
                    promptHistory={promptHistory}
                    uploadedImage={uploadedImage}
                    handleGenerate={handleGenerate}
                    isUploadPanelOpen={isUploadPanelOpen}
                    setIsUploadPanelOpen={setIsUploadPanelOpen}
                    handleImageUpload={handleImageUpload}
                    handleRemoveUploadedImage={handleRemoveUploadedImage}
                    fileInputRef={fileInputRef}
                    uploadedImageUrl={uploadedImageUrl}
                    activeImageUrl={activeImageUrl}
                    editPrompt={editPrompt}
                    setEditPrompt={setEditPrompt}
                    handleEditWithPrompt={handleEditWithPrompt}
                    handleUpscale={handleUpscale}
                    handleApplyFilter={handleApplyFilter}
                    handleChangeAspectRatio={handleChangeAspectRatio}
                />
                <Canvas
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    error={error}
                    setError={setError}
                    activeImageUrl={activeImageUrl}
                    handleDownload={handleDownload}
                />
            </main>
        </div>
    );
};

export default App;
