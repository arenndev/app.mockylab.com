'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import BlueprintSelectModal from '@/components/Modals/BlueprintSelectModal';
import VariantSelectModal from '@/components/Modals/VariantSelectModal';
import { authService } from '@/services/authService';
import { printifyService } from '@/services/printifyService';
import type { Blueprint as PrintifyBlueprint, BlueprintVariant, UserOfVariant } from '@/types/printify';

interface Blueprint extends PrintifyBlueprint {
    variants: (BlueprintVariant & {
        price: number;
        isEnabled: boolean;
    })[];
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
    userId?: string;
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
    const handleBlueprintSelect = async (blueprint: PrintifyBlueprint) => {
        try {
            const blueprintDetails = await printifyService.getBlueprintDetails(blueprint.id);
            const userId = authService.getUserId();
            
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Önce tüm varyantları al
            const allVariants = await printifyService.getBlueprintVariants(blueprint.id, {
                printProviderId: 99,
                page: 1,
                pageSize: 1000
            });

            // Sonra kullanıcının varyantlarını al
            const userVariants = await printifyService.getUserVariantsByBlueprint(userId.toString(), blueprint.id);

            // Varyantları birleştir
            const updatedBlueprint: Blueprint = {
                ...blueprintDetails,
                variants: userVariants.map((uv: UserOfVariant) => {
                    const variantDetails = allVariants.variants.find(v => v.variantId === uv.variantId);
                    return {
                        ...variantDetails,
                        id: uv.variantId,
                        price: uv.defaultPrice,
                        isEnabled: uv.isEnabled
                    };
                })
            };

            // Kullanıcının aktif varyantlarını form datasına ekle
            const activeVariants = userVariants
                .filter((uv: UserOfVariant) => uv.isEnabled)
                .map((uv: UserOfVariant) => ({
                    variantId: uv.variantId,
                    price: uv.defaultPrice,
                    isEnabled: true
                }));

            setSelectedBlueprint(updatedBlueprint);
            setFormData(prev => ({
                ...prev,
                blueprintId: blueprint.id,
                title: blueprintDetails.title,
                description: blueprintDetails.description,
                variants: activeVariants
            }));

            setIsBlueprintModalOpen(false);
            setIsVariantModalOpen(true);
        } catch (error) {
            console.error('Error fetching blueprint details:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch blueprint details');
        }
    };

    // Variant seçimi
    const handleVariantsSelect = (variants: { variantId: number; price: number; isEnabled: boolean; }[]) => {
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
            // Form validasyonu
            if (!formData.blueprintId) {
                throw new Error('Please select a blueprint');
            }

            if (!formData.variants || formData.variants.length === 0) {
                throw new Error('Please select at least one variant');
            }

            if (!formData.title.trim()) {
                throw new Error('Please enter a product title');
            }

            if (!formData.description.trim()) {
                throw new Error('Please enter a product description');
            }

            if (!formData.printifyImageId) {
                throw new Error('Please upload a product image');
            }

            // Kullanıcı kontrolü
            const userId = authService.getUserId();
            if (!userId) {
                throw new Error('User authentication error');
            }

            // Create product
            const response = await printifyService.createProduct({
                title: formData.title,
                description: formData.description,
                tags: formData.tags,
                blueprintId: formData.blueprintId,
                variants: formData.variants.map(v => ({
                    variantId: v.variantId,
                    price: v.price,
                    isEnabled: v.isEnabled
                })),
                printifyImageId: formData.printifyImageId,
                userId: userId
            });

            if (response.success) {
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
                router.push('/printify/products');
            } else {
                throw new Error(response.message || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
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
                            <div className="flex flex-col gap-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            try {
                                                setLoading(true);
                                                setError(null);
                                                
                                                const userId = authService.getUserId();
                                                if (!userId) {
                                                    throw new Error('No user information available');
                                                }

                                                const file = e.target.files[0];
                                                const formData = new FormData();
                                                formData.append('ImageFile', file);
                                                formData.append('FileName', file.name);
                                                formData.append('UserId', userId);

                                                const response = await printifyService.uploadImage(formData);

                                                if (!response.success || !response.data) {
                                                    throw new Error(response.message || 'Failed to upload image');
                                                }

                                                const { printifyImageId } = response.data;
                                                if (!printifyImageId) {
                                                    throw new Error('No printify image ID received');
                                                }

                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    printifyImageId
                                                }));
                                            } catch (error) {
                                                console.error('Error uploading image:', error);
                                                setError(error instanceof Error ? error.message : 'Failed to upload image');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                    className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition file:mr-5 file:border-collapse file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-stroke file:bg-whiter file:px-5 file:py-2 file:hover:bg-primary file:hover:bg-opacity-10 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-form-strokedark dark:file:bg-white/30 dark:file:text-white"
                                />
                                {formData.printifyImageId && (
                                    <div className="text-sm text-success">
                                        Image uploaded successfully
                                    </div>
                                )}
                            </div>
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