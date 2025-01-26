'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';
import Link from 'next/link';
import type { Product } from '@/types/printify';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface ProductImage {
    src: string;
    isDefault: boolean;
}

interface PaginatedResponse {
    currentPage: number;
    data: Product[];
    lastPage: number;
    total: number;
    perPage: number;
}

export default function PrintifyProducts() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const itemsPerPage = 20;

    const fetchProducts = async (page: number) => {
        try {
            setIsLoading(true);
            setError(null);
            const shopId = await printifyService.getShopId();
            const response = await printifyService.getProducts(shopId, page, itemsPerPage);
            
            setProducts(response.data);
            setCurrentPage(response.currentPage);
            setTotalPages(response.lastPage);
            setTotalItems(response.total);
        } catch (err) {
            console.error('Error in fetchProducts:', err);
            setError('Failed to load products. Please try again.');
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(currentPage);
    }, [currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="relative sm:ml-64 bg-bodydark2 dark:bg-boxdark">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                    <div className="flex flex-col gap-6">
                        <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h1 className="text-title-md font-bold text-black dark:text-white">Printify Products</h1>
                                    <p className="text-sm text-body-color dark:text-body-color-dark mt-1">
                                        Total {totalItems} products
                                    </p>
                                </div>
                                <Link
                                    href="/printify/products/create"
                                    className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90"
                                >
                                    Create Product
                                </Link>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                                </div>
                            ) : error ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <p className="text-danger mb-3">{error}</p>
                                    <button
                                        onClick={() => fetchProducts(currentPage)}
                                        className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:gap-5">
                                        {products.map((product) => (
                                            <div key={product.id} className="rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-boxdark">
                                                <div className="relative aspect-[3/2] mb-3">
                                                    <img
                                                        src={product.images[0]?.src || '/images/product-placeholder.png'}
                                                        alt={product.title}
                                                        className="h-full w-full rounded object-cover"
                                                    />
                                                </div>
                                                <h3 className="mb-1 text-sm font-medium text-black dark:text-white line-clamp-1">
                                                    {product.title}
                                                </h3>
                                                <p className="text-xs text-body-color dark:text-body-color-dark mb-2 line-clamp-2">
                                                    {product.description}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {product.tags.slice(0, 3).map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-block rounded bg-gray-2 py-1 px-1.5 text-xs font-medium text-black dark:bg-meta-4 dark:text-white"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {product.tags.length > 3 && (
                                                        <span className="inline-block rounded bg-gray-2 py-1 px-1.5 text-xs font-medium text-black dark:bg-meta-4 dark:text-white">
                                                            +{product.tags.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-medium ${product.visible ? 'text-success' : 'text-danger'}`}>
                                                        {product.visible ? 'Published' : 'Draft'}
                                                    </span>
                                                    <Link
                                                        href={`/printify/products/${product.id}`}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                                            <div className="text-sm text-body-color dark:text-body-color-dark">
                                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="flex items-center justify-center rounded bg-primary py-1.5 px-3 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                                                >
                                                    Previous
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                        let pageNum;
                                                        if (totalPages <= 5) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            pageNum = i + 1;
                                                        } else if (currentPage >= totalPages - 2) {
                                                            pageNum = totalPages - 4 + i;
                                                        } else {
                                                            pageNum = currentPage - 2 + i;
                                                        }
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => handlePageChange(pageNum)}
                                                                className={`w-8 h-8 rounded flex items-center justify-center text-sm ${
                                                                    currentPage === pageNum
                                                                        ? 'bg-primary text-white'
                                                                        : 'text-body-color dark:text-body-color-dark hover:bg-gray-2 dark:hover:bg-meta-4'
                                                                }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="flex items-center justify-center rounded bg-primary py-1.5 px-3 text-sm text-white hover:bg-opacity-90 disabled:opacity-50"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
} 