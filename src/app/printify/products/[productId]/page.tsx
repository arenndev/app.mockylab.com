'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { printifyService } from '@/services/printifyService';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface ProductImage {
    src: string;
    variantIds: number[];
    position: string;
    isDefault: boolean;
    isSelectedForPublishing: boolean;
}

interface ProductVariant {
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    isEnabled: boolean;
    isDefault: boolean;
    isAvailable: boolean;
    options: number[];
    quantity: number;
}

interface ProductOption {
    name: string;
    type: string;
    values: {
        id: number;
        title: string;
        colors: string[];
    }[];
    displayInPreview: boolean;
}

interface Product {
    id: string;
    title: string;
    description: string;
    tags: string[];
    options: ProductOption[];
    variants: ProductVariant[];
    images: ProductImage[];
    visible: boolean;
    isLocked: boolean;
    blueprintId: number;
    createdAt: string;
    updatedAt: string;
}

export default function ProductDetail({ params }: { params: { productId: string } }) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTags, setEditingTags] = useState(false);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const shopId = await printifyService.getShopId();
            const productData = await printifyService.getProduct(shopId, params.productId);
            setProduct(productData);
            setTags(productData.tags);
        } catch (err) {
            setError('Failed to load product details. Please try again.');
            console.error('Error fetching product:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [params.productId]);

    const handleUpdateTags = async () => {
        if (!product) return;

        try {
            setIsSaving(true);
            const shopId = await printifyService.getShopId();
            await printifyService.updateProductTags(shopId, product.id, tags);
            setEditingTags(false);
        } catch (err) {
            setError('Failed to update tags. Please try again.');
            console.error('Error updating tags:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            );
        }

        if (error || !product) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                    <p className="text-danger mb-4">{error || 'Product not found'}</p>
                    <button
                        onClick={fetchProduct}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Images */}
                <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h2 className="text-title-md font-semibold text-black dark:text-white mb-4">Product Images</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {product.images.map((image, index) => (
                            <div key={index} className="relative aspect-square">
                                <img
                                    src={image.src}
                                    alt={`Product image ${index + 1}`}
                                    className="h-full w-full rounded object-cover"
                                />
                                {image.isDefault && (
                                    <span className="absolute top-2 right-2 bg-primary text-white px-2 py-1 text-xs rounded">
                                        Default
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    {/* Description */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h2 className="text-title-md font-semibold text-black dark:text-white mb-3">Description</h2>
                        <p className="text-sm text-body-color dark:text-body-color-dark">{product.description}</p>
                    </div>

                    {/* Tags Section */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-title-md font-semibold text-black dark:text-white">Tags</h2>
                            <button
                                onClick={() => setEditingTags(!editingTags)}
                                className="text-sm text-primary hover:text-opacity-80"
                            >
                                {editingTags ? 'Cancel' : 'Edit Tags'}
                            </button>
                        </div>
                        
                        {editingTags ? (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                        placeholder="Add new tag"
                                        className="flex-1 rounded border-[1.5px] border-stroke bg-transparent py-2 px-5 text-sm outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="inline-flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center gap-1 rounded bg-gray-2 py-1 px-2 text-sm font-medium text-black dark:bg-meta-4 dark:text-white"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-danger hover:text-opacity-90 ml-1"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={handleUpdateTags}
                                    disabled={isSaving}
                                    className="w-full inline-flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : 'Save Tags'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-block rounded bg-gray-2 py-1 px-2 text-sm font-medium text-black dark:bg-meta-4 dark:text-white"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Variants Section */}
                    <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h2 className="text-title-md font-semibold text-black dark:text-white mb-4">Variants</h2>
                        <div className="space-y-3">
                            {product.variants.map((variant) => (
                                <div
                                    key={variant.id}
                                    className="rounded-sm border border-stroke p-3 dark:border-strokedark"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-sm font-medium text-black dark:text-white">
                                            {variant.title}
                                        </h3>
                                        <span className={`text-xs font-medium ${variant.isEnabled ? 'text-success' : 'text-danger'}`}>
                                            {variant.isEnabled ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-body-color dark:text-body-color-dark">
                                        <div>SKU: {variant.sku}</div>
                                        <div>Price: ${variant.price}</div>
                                        <div>Cost: ${variant.cost}</div>
                                        <div>Quantity: {variant.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative sm:ml-64 bg-bodydark2 dark:bg-boxdark">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-title-md2 font-bold text-black dark:text-white">
                                {product?.title || 'Product Details'}
                            </h3>
                            <button
                                onClick={() => router.back()}
                                className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-md border border-stroke py-2 px-6 text-center font-medium hover:bg-opacity-80 dark:border-strokedark"
                            >
                                Back to Products
                            </button>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </div>
        </>
    );
} 