'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';

interface Blueprint {
    id: string;
    title: string;
    description: string;
    brand: string;
    model: string;
    variants: BlueprintVariant[];
    images: string[];
}

interface BlueprintVariant {
    id: number;
    variantId: number;
    title: string;
    options: Record<string, string>;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onBlueprintSelect: (blueprint: Blueprint) => void;
}

const BlueprintSelectModal = ({ isOpen, onClose, onBlueprintSelect }: Props) => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        search: '',
        brand: '',
        model: ''
    });

    // Fetch blueprints
    useEffect(() => {
        if (isOpen) {
            fetchBlueprints();
        }
    }, [isOpen]);

    const fetchBlueprints = async () => {
        setLoading(true);
        try {
            const token = authService.getToken();
            if (!token) {
                setError('No auth token available');
                return;
            }
            const response = await axios.get('http://localhost:5002/api/UserOfBlueprint/user/1', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Fetch blueprint details for each user blueprint
            const detailedBlueprints = await Promise.all(
                response.data.map(async (userBlueprint: { blueprintId: number }) => {
                    const blueprintResponse = await axios.get(
                        `http://localhost:5002/api/Printify/blueprints/${userBlueprint.blueprintId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );
                    return blueprintResponse.data;
                })
            );

            setBlueprints(detailedBlueprints);
        } catch (error) {
            console.error('Error fetching blueprints:', error);
            setError('Failed to load blueprints');
        } finally {
            setLoading(false);
        }
    };

    // Filter blueprints
    const filteredBlueprints = blueprints.filter(blueprint => {
        const searchMatch = blueprint.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                          blueprint.description.toLowerCase().includes(filters.search.toLowerCase());
        const brandMatch = !filters.brand || blueprint.brand.toLowerCase() === filters.brand.toLowerCase();
        const modelMatch = !filters.model || blueprint.model.toLowerCase() === filters.model.toLowerCase();
        return searchMatch && brandMatch && modelMatch;
    });

    // Get unique brands and models for filters
    const brands = [...new Set(blueprints.map(b => b.brand))];
    const models = [...new Set(blueprints.map(b => b.model))];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-4xl bg-white dark:bg-boxdark rounded-sm shadow-default p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-black dark:text-white">
                        Select Blueprint
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-black dark:text-white hover:text-opacity-70"
                    >
                        ×
                    </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.brand}
                            onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <option value="">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.model}
                            onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
                            className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                        >
                            <option value="">All Models</option>
                            {models.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Blueprint List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : error ? (
                        <div className="text-danger text-center py-4">{error}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            {filteredBlueprints.map(blueprint => (
                                <div
                                    key={blueprint.id}
                                    className="border border-stroke dark:border-strokedark rounded-sm p-4 hover:border-primary dark:hover:border-primary cursor-pointer"
                                    onClick={() => onBlueprintSelect(blueprint)}
                                >
                                    <div className="flex items-center gap-4">
                                        {blueprint.images?.[0] && (
                                            <img
                                                src={blueprint.images[0]}
                                                alt={blueprint.title}
                                                className="w-20 h-20 object-cover rounded-sm"
                                            />
                                        )}
                                        <div>
                                            <h4 className="text-black dark:text-white font-medium">
                                                {blueprint.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {blueprint.brand} - {blueprint.model}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {blueprint.variants?.length || 0} variants
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlueprintSelectModal; 