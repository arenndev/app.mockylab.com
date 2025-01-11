'use client';

import { useState } from 'react';

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
    const [localVariants, setLocalVariants] = useState<VariantSelection[]>(selectedVariants);

    // Filter variants
    const filteredVariants = variants.filter(variant =>
        variant.title.toLowerCase().includes(search.toLowerCase()) ||
        Object.values(variant.options).some(value =>
            value.toLowerCase().includes(search.toLowerCase())
        )
    );

    const handleVariantToggle = (variantId: number) => {
        setLocalVariants(prev => {
            const existing = prev.find(v => v.variantId === variantId);
            if (existing) {
                return prev.map(v =>
                    v.variantId === variantId
                        ? { ...v, isEnabled: !v.isEnabled }
                        : v
                );
            } else {
                return [...prev, { variantId, price: 30.00, isEnabled: true }];
            }
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
                        Select Variants
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
                        {filteredVariants.map(variant => {
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
                                                onChange={() => handleVariantToggle(variant.variantId)}
                                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <h4 className="text-black dark:text-white font-medium">
                                                    {variant.title}
                                                </h4>
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