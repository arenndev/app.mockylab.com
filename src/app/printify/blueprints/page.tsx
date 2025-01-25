"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import axios from 'axios';
import { authService } from '@/services/authService';
import { API_URL } from '@/utils/apiConfig';

interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

interface BlueprintListResponse {
  items: Blueprint[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Filters {
  search: string;
  brand: string;
  model: string;
}

const PrintifyBlueprints = () => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    brand: '',
    model: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [blueprints, setBlueprints] = useState<BlueprintListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [selectedBlueprints, setSelectedBlueprints] = useState<Set<number>>(new Set());
  const [isAccepting, setIsAccepting] = useState<number | null>(null);

  const fetchBlueprints = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams();
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.brand) queryParams.append('brand', filters.brand);
      queryParams.append('page', page.toString());
      queryParams.append('pageSize', pageSize.toString());

      console.log('Fetching with params:', queryParams.toString());

      const response = await axios.get<BlueprintListResponse>(
        `${API_URL}/Printify/blueprints?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setBlueprints(response.data);
    } catch (error) {
      console.error('Error fetching blueprints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load - fetch on component mount
  useEffect(() => {
    fetchBlueprints();
  }, []); // Empty dependency array - only run once on mount

  // Fetch user's existing blueprints
  useEffect(() => {
    const fetchUserBlueprints = async () => {
      try {
        const token = authService.getToken();
        const response = await axios.get(`${API_URL}/UserOfBlueprint/user/1`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const userBlueprintIds: Set<number> = new Set(response.data.map((ub: { blueprintId: number }) => ub.blueprintId));
        setSelectedBlueprints(userBlueprintIds);
      } catch (error) {
        console.error('Error fetching user blueprints:', error);
      }
    };

    fetchUserBlueprints();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setPage(1);
    fetchBlueprints();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBlueprints();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      brand: '',
      model: ''
    });
    setPage(1);
    fetchBlueprints();
  };

  const handleAcceptBlueprint = async (blueprintId: number) => {
    setIsAccepting(blueprintId);
    try {
      const token = authService.getToken();
      
      const variantCheckResponse = await axios.post(
        `${API_URL}/Printify/blueprints/${blueprintId}/variants/sync`,
        {},
        {
          params: {
            printProviderId: 99
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (variantCheckResponse.status === 200) {
        await axios.post(`${API_URL}/UserOfBlueprint`, {
          userId: 1,
          blueprintId: blueprintId
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setSelectedBlueprints(prev => new Set([...prev, blueprintId]));
      }
    } catch (error) {
      console.error('Error accepting blueprint:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 500 && error.response?.data.includes('404')) {
          alert('This blueprint is not available for the selected provider (99). Please choose another blueprint.');
        } else {
          alert('An error occurred while adding the blueprint. Please try again.');
        }
      }
    } finally {
      setIsAccepting(null);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Printify Blueprints" />

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Search and Filter Section */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-4">
                    <input
                      type="text"
                      placeholder="Search in title, description or model..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full md:w-72 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Filter by brand..."
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      className="w-full md:w-72 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Filter by model..."
                      value={filters.model}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                      className="w-full md:w-72 rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleSearch}
                      className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Search
                    </button>
                    <button
                      onClick={resetFilters}
                      className="bg-danger text-white px-4 py-2 rounded-md hover:bg-danger/90 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Blueprints Grid */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="p-6.5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {blueprints?.items.length || 0} of {blueprints?.totalCount || 0} blueprints
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {blueprints?.items.map((blueprint) => (
                        <div key={blueprint.id} className="border rounded-lg overflow-hidden">
                          {blueprint.images.length > 0 ? (
                            <img
                              src={blueprint.images[0]}
                              alt={blueprint.title}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <span className="text-gray-400">No image</span>
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{blueprint.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">Brand: {blueprint.brand}</p>
                            <p className="text-sm text-gray-600 mb-4">Model: {blueprint.model}</p>
                            
                            {/* Accept Button */}
                            <button
                              onClick={() => handleAcceptBlueprint(blueprint.id)}
                              disabled={selectedBlueprints.has(blueprint.id) || isAccepting === blueprint.id}
                              className={`w-full px-4 py-2 rounded transition-colors ${
                                selectedBlueprints.has(blueprint.id)
                                  ? 'bg-success text-white cursor-not-allowed'
                                  : 'bg-primary text-white hover:bg-primary/90'
                              }`}
                            >
                              {isAccepting === blueprint.id ? (
                                <span className="flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Adding...
                                </span>
                              ) : selectedBlueprints.has(blueprint.id) ? (
                                'Added'
                              ) : (
                                'Add to My Blueprints'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {blueprints && blueprints.totalCount > 0 && (
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!blueprints?.hasPreviousPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <span className="text-sm">
                            Page {blueprints.currentPage} of {blueprints.totalPages}
                          </span>
                          <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={!blueprints?.hasNextPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {blueprints.totalCount} items
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PrintifyBlueprints; 