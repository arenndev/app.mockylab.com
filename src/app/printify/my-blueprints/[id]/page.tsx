"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { printifyService } from '@/services/printifyService';
import { authService } from '@/services/authService';
import { getCurrentUserId } from '@/utils/apiConfig';
import { useParams } from 'next/navigation';
import type { Blueprint, VariantResponse } from '@/types/printify';
import VariantManagementModal from '@/components/Modals/VariantManagementModal';

const BlueprintDetail = () => {
  const params = useParams();
  const blueprintId = params.id as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [variants, setVariants] = useState<VariantResponse | null>(null);
  const [userVariants, setUserVariants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUserVariants, setIsLoadingUserVariants] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [isSyncing, setIsSyncing] = useState(false);
  const [needsSync, setNeedsSync] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isVariantsOpen, setIsVariantsOpen] = useState(false);

  const fetchBlueprint = async () => {
    try {
      const data = await printifyService.getBlueprintDetails(parseInt(blueprintId));
      setBlueprint(data);
      return data;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch blueprint details');
      }
      return null;
    }
  };

  const fetchVariants = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await printifyService.getBlueprintVariants(parseInt(blueprintId), {
        printProviderId: 99,
        page,
        pageSize
      });
      
      if (!response.variants || response.variants.length === 0) {
        setNeedsSync(true);
        setVariants(null);
      } else {
        setNeedsSync(false);
        setVariants(response);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        if (err.message.includes('404') || err.message.includes('500')) {
          setNeedsSync(true);
        }
      } else {
        setError('Failed to fetch variants');
      }
      setVariants(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVariants = async () => {
    setIsLoadingUserVariants(true);
    try {
      const userId = getCurrentUserId();
      console.log('Fetching variants for user ID:', userId, 'and blueprint ID:', blueprintId);

      const variants = await printifyService.getUserVariantsByBlueprint(userId, parseInt(blueprintId));
      console.log('User variants response:', variants);
      setUserVariants(variants);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch user variants');
      }
    } finally {
      setIsLoadingUserVariants(false);
    }
  };

  const syncVariants = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await printifyService.syncBlueprintVariants(parseInt(blueprintId), 99);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await fetchVariants();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sync variants');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await fetchBlueprint();
      await fetchUserVariants();
      await fetchVariants();
    };
    
    initializeData();
  }, [blueprintId]);

  // Update variants when page changes
  useEffect(() => {
    if (variants) {
      fetchVariants();
    }
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const enabledVariants = userVariants.filter(v => v.isEnabled);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName={blueprint?.title || 'Blueprint Details'} />

        <div className="grid grid-cols-1 gap-9">
          {/* Blueprint Info */}
          {blueprint && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6.5">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  {blueprint.images.length > 0 && (
                    <img
                      src={blueprint.images[0]}
                      alt={blueprint.title}
                      className="w-full rounded-lg object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.jpg';
                      }}
                    />
                  )}
                </div>
                <div className="w-full md:w-2/3">
                  <h2 className="text-2xl font-bold mb-4">{blueprint.title}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-2">Brand: {blueprint.brand}</p>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">Model: {blueprint.model}</p>
                  <p className="text-gray-600 dark:text-gray-300">{blueprint.description}</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setIsVariantModalOpen(true)}
                      className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Manage Variants
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Variants Summary */}
          {!isLoadingUserVariants && enabledVariants.length > 0 && (
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">Selected Variants ({enabledVariants.length})</h3>
              </div>
              <div className="p-6.5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enabledVariants.map((variant) => {
                    const variantDetails = variants?.variants.find(v => v.variantId === variant.variantId);
                    return (
                      <div key={variant.id} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{variantDetails?.title || variant.variantId}</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <p className="mb-2">Price: ${variant.defaultPrice}</p>
                          {variantDetails && (
                            <div>
                              {Object.entries(variantDetails.options).map(([key, value]) => (
                                <p key={key} className="ml-2">
                                  {key}: {String(value)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Available Variants */}
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div 
              className="border-b border-stroke px-6.5 py-4 dark:border-strokedark cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsVariantsOpen(!isVariantsOpen)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-black dark:text-white">Available Variants</h3>
                <div className="flex items-center gap-3">
                  {needsSync && !error && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        syncVariants();
                      }}
                      disabled={isSyncing}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Variants'}
                    </button>
                  )}
                  <svg
                    className={`w-5 h-5 transition-transform ${isVariantsOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {isVariantsOpen && (
              <div className="p-6.5">
                {error && (
                  <div className="bg-danger/10 text-danger px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}

                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : variants ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {variants.variants.map((variant) => (
                        <div key={variant.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{variant.title}</h4>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div className="mt-2">
                              <p className="font-medium mb-1">Options:</p>
                              {Object.entries(variant.options).map(([key, value]) => (
                                <p key={key} className="ml-2">
                                  {key}: {String(value)}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {variants.totalCount > 0 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!variants.hasPreviousPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm">
                            Page {variants.currentPage} of {variants.totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!variants.hasNextPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {variants.totalCount} items
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No variants found for this blueprint. {needsSync ? 'Click "Sync Variants" to fetch them from Printify.' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Variant Management Modal */}
      {variants && (
        <VariantManagementModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          blueprintId={blueprintId}
          variants={variants.variants}
          onSave={fetchUserVariants}
        />
      )}
    </DefaultLayout>
  );
};

export default BlueprintDetail; 