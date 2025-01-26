'use client';

import { useState, useEffect, useMemo } from 'react';

interface BlueprintVariant {
    id: number;
    variantId: number;
    title: string;
    options: Record<string, string>;
}

interface VariantSelection {
    variantId: number;
    price: number;
    isEnabled: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    variants: BlueprintVariant[];
    selectedVariants: VariantSelection[];
    onVariantsSelect: (variants: VariantSelection[]) => void;
}

const VariantSelectModal = ({ isOpen, onClose, variants, selectedVariants, onVariantsSelect }: Props) => {
    const [search, setSearch] = useState('');
    const [localVariants, setLocalVariants] = useState<VariantSelection[]>(
        variants.map(variant => ({
            variantId: variant.variantId,
            price: selectedVariants.find(v => v.variantId === variant.variantId)?.price || 30.00,
            isEnabled: selectedVariants.some(v => v.variantId === variant.variantId && v.isEnabled)
        }))
    );
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset local variants when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalVariants(variants.map(variant => ({
                variantId: variant.variantId,
                price: selectedVariants.find(v => v.variantId === variant.variantId)?.price || 30.00,
                isEnabled: selectedVariants.some(v => v.variantId === variant.variantId && v.isEnabled)
            })));
        }
    }, [isOpen, variants, selectedVariants]);

    // Group and filter variants
    const filteredVariants = useMemo(() => {
        const searchTerm = search.toLowerCase().trim();
        
        // First group by color
        const grouped = variants.reduce((acc, variant) => {
            const color = variant.options.color || 'No Color';
            if (!acc[color]) {
                acc[color] = [];
            }
            
            // Only add if matches search
            if (searchTerm === '' || 
                variant.title.toLowerCase().includes(searchTerm) ||
                Object.values(variant.options).some(value => 
                    value.toLowerCase().includes(searchTerm)
                )) {
                acc[color].push(variant);
            }
            
            return acc;
        }, {} as Record<string, BlueprintVariant[]>);

        // Remove empty color groups
        return Object.fromEntries(
            Object.entries(grouped).filter(([_, variants]) => variants.length > 0)
        );
    }, [variants, search]);

    // Calculate pagination
    const totalVariants = Object.values(filteredVariants).reduce((acc, group) => acc + group.length, 0);
    const totalPages = Math.ceil(totalVariants / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Get current page variants with proper pagination
    const currentVariants = useMemo(() => {
        let count = 0;
        const result: Record<string, BlueprintVariant[]> = {};
        
        for (const [color, colorVariants] of Object.entries(filteredVariants)) {
            if (count >= endIndex) break;
            
            if (count + colorVariants.length > startIndex) {
                const start = Math.max(0, startIndex - count);
                const end = Math.min(colorVariants.length, endIndex - count);
                result[color] = colorVariants.slice(start, end);
            }
            
            count += colorVariants.length;
        }
        
        return result;
    }, [filteredVariants, startIndex, endIndex]);

    const handleVariantToggle = (variant: BlueprintVariant) => {
        setLocalVariants(prev => {
            const index = prev.findIndex(v => v.variantId === variant.variantId);
            if (index >= 0) {
                // Varyant zaten listede var
                const newVariants = [...prev];
                if (newVariants[index].isEnabled) {
                    // Varyant aktifse, listeden çıkar
                    return newVariants.filter(v => v.variantId !== variant.variantId);
                } else {
                    // Varyant pasifse, aktif yap
                    newVariants[index] = {
                        ...newVariants[index],
                        isEnabled: true
                    };
                    return newVariants;
                }
            }
            // Varyant listede yoksa, ekle
            return [...prev, {
                variantId: variant.variantId,
                price: 30.00,
                isEnabled: true
            }];
        });
    };

    const handlePriceChange = (variantId: number, price: number) => {
        setLocalVariants(prev =>
            prev.map(v =>
                v.variantId === variantId
                    ? { ...v, price }
                    : v
            )
        );
    };

    const handleSave = () => {
        onVariantsSelect(localVariants);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl bg-white dark:bg-boxdark rounded-sm shadow-default p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-black dark:text-white">
                        Select Variants ({totalVariants} variants)
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-black dark:text-white hover:text-opacity-70"
                    >
                        ×
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search variants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                </div>

                {/* Variant List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {Object.entries(currentVariants).map(([color, variants]) => (
                            <div key={color}>
                                <h4 className="text-black dark:text-white font-medium mb-2">
                                    {color}
                                </h4>
                                <div className="space-y-4">
                                    {variants.map(variant => {
                                        const selected = localVariants.find(v => v.variantId === variant.variantId);
                                        return (
                                            <div
                                                key={variant.id}
                                                className="border border-stroke dark:border-strokedark rounded-sm p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected?.isEnabled ?? false}
                                                            onChange={() => handleVariantToggle(variant)}
                                                            className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <div>
                                                            <h5 className="text-black dark:text-white font-medium">
                                                                {variant.title}
                                                            </h5>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {Object.entries(variant.options).map(([key, value]) => (
                                                                    <span key={key} className="mr-2">
                                                                        {key}: {value}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selected?.isEnabled && (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={selected.price}
                                                            onChange={(e) => handlePriceChange(variant.variantId, parseFloat(e.target.value))}
                                                            className="w-24 rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-stroke dark:border-strokedark rounded-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-stroke dark:border-strokedark rounded-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-6">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center justify-center rounded-md border border-primary py-3 px-10 text-center font-medium text-primary hover:bg-opacity-90"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="inline-flex items-center justify-center rounded-md bg-primary py-3 px-10 text-center font-medium text-white hover:bg-opacity-90"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VariantSelectModal; 