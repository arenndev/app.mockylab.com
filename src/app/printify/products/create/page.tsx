'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { API_URL } from '@/utils/apiConfig';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BlueprintSelectModal from '@/components/Modals/BlueprintSelectModal';
import VariantSelectModal from '@/components/Modals/VariantSelectModal';
import { authService } from '@/services/authService';

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

interface CreateProductForm {
    title: string;
    description: string;
    tags: string[];
    blueprintId: number;
    variants: {
        variantId: number;
        price: number;
        isEnabled: boolean;
    }[];
    printifyImageId: string;
    catalogImageIds?: string[];
}

const CreateProduct = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
    const [formData, setFormData] = useState<CreateProductForm>({
        title: '',
        description: '',
        tags: [],
        blueprintId: 0,
        variants: [],
        printifyImageId: ''
    });

    // Modal states
    const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    // Tag ekleme
    const handleAddTag = (tag: string) => {
        if (formData.tags.length < 13 && !formData.tags.includes(tag)) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
        }
    };

    // Blueprint seçimi
    const handleBlueprintSelect = async (blueprint: Blueprint) => {
        try {
            const token = authService.getToken();
            if (!token) {
                setError('No auth token available');
                return;
            }

            // Önce blueprint detaylarını al
            const blueprintResponse = await axios.get(
                `${API_URL}/Printify/blueprints/${blueprint.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                }
            );

            if (blueprintResponse.data) {
                const blueprintDetails = blueprintResponse.data;

                // Backend'den variant'ları al
                const variantsResponse = await axios.get(
                    `${API_URL}/Printify/blueprints/${blueprint.id}/variants`,
                    {
                        params: {
                            printProviderId: 99,
                            page: 1,
                            pageSize: 100
                        },
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'accept': 'application/json'
                        }
                    }
                );

                if (variantsResponse.data && variantsResponse.data.variants) {
                    console.log('Variants from API:', variantsResponse.data.variants);
                    const updatedBlueprint = {
                        ...blueprintDetails,
                        variants: variantsResponse.data.variants
                    };
                    console.log('Updated blueprint variants:', updatedBlueprint.variants);

                    setSelectedBlueprint(updatedBlueprint);
                    setFormData(prev => ({
                        ...prev,
                        blueprintId: parseInt(blueprint.id),
                        title: blueprintDetails.title,
                        description: blueprintDetails.description,
                        variants: []
                    }));

                    setIsBlueprintModalOpen(false);
                    setIsVariantModalOpen(true);
                } else {
                    throw new Error('No variants received');
                }
            } else {
                throw new Error('Failed to fetch blueprint details');
            }
        } catch (error) {
            console.error('Error fetching blueprint details:', error);
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.message || error.message;
                setError('Failed to fetch blueprint details: ' + errorMessage);
            } else {
                setError('Failed to fetch blueprint details');
            }
        }
    };

    // Variant seçimi
    const handleVariantsSelect = (variants: { variantId: number; price: number; isEnabled: boolean; }[]) => {
        // Seçilen variant'ları formData'ya ekle
        setFormData(prev => ({
            ...prev,
            variants: variants.map(v => ({
                variantId: v.variantId,
                price: v.price,
                isEnabled: true
            }))
        }));
        setIsVariantModalOpen(false);
    };

    // Form gönderme
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            if (!token) {
                setError('No auth token available');
                return;
            }

            // Validate form data
            if (!formData.blueprintId) {
                setError('Please select a blueprint');
                return;
            }

            if (!formData.variants || formData.variants.length === 0) {
                setError('Please select at least one variant');
                return;
            }

            // Create the request data
            const requestData = {
                ...formData,
                userId: authService.getCurrentUser()?.nameIdentifier || '1',
                variants: formData.variants.map(v => ({
                    variantId: v.variantId,
                    price: v.price,
                    isEnabled: v.isEnabled
                }))
            };

            console.log('Creating product with data:', requestData);

            const response = await axios.post(
                `${API_URL}/Printify/products`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'accept': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setFormData({
                    title: '',
                    description: '',
                    tags: [],
                    blueprintId: 0,
                    variants: [],
                    printifyImageId: ''
                });
                setSelectedBlueprint(null);
                alert('Product created successfully!');
            } else {
                setError(response.data.message || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            if (axios.isAxiosError(error)) {
                const errorData = error.response?.data;
                let errorMessage = 'An error occurred while creating the product';
                
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData?.title) {
                    errorMessage = errorData.title;
                } else if (errorData?.message) {
                    errorMessage = errorData.message;
                } else if (errorData?.errors) {
                    errorMessage = Object.values(errorData.errors).flat().join(', ');
                }
                
                setError(errorMessage);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <DefaultLayout>
            <Breadcrumb pageName="Create Product" />

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h3 className="font-medium text-black dark:text-white">
                        Create New Product
                    </h3>
                </div>
                
                <div className="p-6.5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Blueprint Selection */}
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Blueprint</label>
                            {selectedBlueprint ? (
                                <div className="flex items-center justify-between border border-stroke dark:border-strokedark rounded-sm p-4">
                                    <div className="flex items-center gap-4">
                                        {selectedBlueprint.images?.[0] && (
                                            <img
                                                src={selectedBlueprint.images[0]}
                                                alt={selectedBlueprint.title}
                                                className="w-20 h-20 object-cover rounded-sm"
                                            />
                                        )}
                                        <div>
                                            <h4 className="text-black dark:text-white font-medium">
                                                {selectedBlueprint.title}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {selectedBlueprint.brand} - {selectedBlueprint.model}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {selectedBlueprint.variants?.length || 0} variants
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsVariantModalOpen(true)}
                                            className="inline-flex items-center justify-center rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90"
                                        >
                                            Edit Variants
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsBlueprintModalOpen(true)}
                                            className="inline-flex items-center justify-center rounded-md border border-primary py-2 px-4 text-center font-medium text-primary hover:bg-opacity-90"
                                        >
                                            Change Blueprint
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsBlueprintModalOpen(true)}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary text-left"
                                >
                                    Select a blueprint
                                </button>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Title</label>
                            <input
                                type="text"
                                maxLength={140}
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                rows={4}
                                required
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {formData.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-primary text-white"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                tags: prev.tags.filter((_, i) => i !== index)
                                            }))}
                                            className="ml-2 text-white hover:text-gray-200"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="tag-input"
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    placeholder="Enter a tag"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const input = e.target as HTMLInputElement;
                                            handleAddTag(input.value);
                                            input.value = '';
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const input = document.getElementById('tag-input') as HTMLInputElement;
                                        handleAddTag(input.value);
                                        input.value = '';
                                    }}
                                    className="inline-flex items-center justify-center rounded-md border border-primary py-3 px-10 text-center font-medium text-primary hover:bg-opacity-90"
                                >
                                    Add Tag
                                </button>
                            </div>
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white">Product Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        try {
                                            const token = authService.getToken();
                                            const currentUser = authService.getCurrentUser();
                                            
                                            if (!token) {
                                                setError('No auth token available');
                                                return;
                                            }

                                            if (!currentUser) {
                                                setError('No user information available');
                                                return;
                                            }

                                            const formData = new FormData();
                                            const file = e.target.files[0];
                                            
                                            formData.append('ImageFile', file);
                                            formData.append('FileName', file.name);
                                            formData.append('UserId', currentUser.nameIdentifier || '1');

                                            console.log('Uploading file:', {
                                                name: file.name,
                                                size: file.size,
                                                type: file.type
                                            });

                                            // FormData içeriğini kontrol et
                                            for (let pair of formData.entries()) {
                                                console.log(pair[0] + ': ' + pair[1]);
                                            }

                                            const response = await axios.post(
                                                `${API_URL}/PrintifyImage/upload`,
                                                formData,
                                                {
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'accept': '*/*',
                                                        'Content-Type': 'multipart/form-data'
                                                    },
                                                    transformRequest: [(data, headers) => {
                                                        // Axios'un otomatik dönüşümünü engelle
                                                        return data;
                                                    }]
                                                }
                                            );

                                            if (response.data.success) {
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    printifyImageId: response.data.data.printifyImageId 
                                                }));
                                                console.log('Upload successful:', response.data);
                                            } else {
                                                console.error('Upload failed:', response.data);
                                                setError('Failed to upload image: ' + response.data.message);
                                            }
                                        } catch (error) {
                                            console.error('Error uploading image:', error);
                                            if (axios.isAxiosError(error)) {
                                                const errorMessage = error.response?.data?.message || error.message;
                                                console.error('Axios error details:', {
                                                    status: error.response?.status,
                                                    data: error.response?.data,
                                                    headers: error.response?.headers,
                                                    requestHeaders: error.config?.headers,
                                                    requestData: error.config?.data
                                                });

                                                if (error.response?.status === 401) {
                                                    setError('Authentication failed. Please try logging in again.');
                                                } else if (error.response?.status === 400) {
                                                    setError('Invalid file or request format: ' + (error.response?.data?.message || 'Please try again'));
                                                } else {
                                                    setError('Failed to upload image: ' + errorMessage);
                                                }
                                            } else {
                                                setError('Failed to upload image');
                                            }
                                        }
                                    }
                                }}
                                className="w-full cursor-pointer rounded-lg border-[1.5px] border-stroke bg-transparent font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:py-3 file:px-5 file:hover:bg-primary file:hover:bg-opacity-10 focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white dark:focus:border-primary"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !selectedBlueprint || formData.variants.length === 0}
                            className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:bg-opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Product'}
                        </button>

                        {/* Error Message */}
                        {error && (
                            <div className="text-danger">{error}</div>
                        )}
                    </form>
                </div>
            </div>

            {/* Modals */}
            <BlueprintSelectModal
                isOpen={isBlueprintModalOpen}
                onClose={() => setIsBlueprintModalOpen(false)}
                onBlueprintSelect={handleBlueprintSelect}
            />

            {selectedBlueprint && (
                <>
                    {console.log('Variants being passed to modal:', selectedBlueprint.variants)}
                    <VariantSelectModal
                        isOpen={isVariantModalOpen}
                        onClose={() => setIsVariantModalOpen(false)}
                        variants={selectedBlueprint.variants}
                        selectedVariants={formData.variants}
                        onVariantsSelect={handleVariantsSelect}
                    />
                </>
            )}
        </DefaultLayout>
    );
};

export default CreateProduct; 