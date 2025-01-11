"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import axios from 'axios';
import { authService } from '@/services/authService';

interface Blueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

interface UserBlueprint {
  id: number;
  userId: number;
  blueprintId: number;
  createdAt: string;
  updatedAt: string | null;
  isActive: boolean;
  blueprint?: Blueprint;
}

const MyBlueprints = () => {
  const [userBlueprints, setUserBlueprints] = useState<UserBlueprint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlueprintDetails = async (blueprintId: number, token: string, retryCount = 0): Promise<Blueprint | null> => {
    try {
      const response = await axios.get<Blueprint>(
        `http://localhost:5002/api/Printify/blueprints/${blueprintId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (err) {
      console.error(`Error fetching blueprint ${blueprintId}:`, err);
      if (retryCount < 2) {
        // 1 saniye bekle ve tekrar dene
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchBlueprintDetails(blueprintId, token, retryCount + 1);
      }
      return null;
    }
  };

  const fetchUserBlueprints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = authService.getToken();
      if (!token) {
        console.error('No auth token available');
        return null;
      }
      const response = await axios.get<UserBlueprint[]>(
        'http://localhost:5002/api/UserOfBlueprint/user/1',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Her bir blueprint için detayları al (3 deneme hakkıyla)
      const detailedBlueprints = await Promise.all(
        response.data.map(async (userBlueprint) => {
          const blueprint = await fetchBlueprintDetails(userBlueprint.blueprintId, token);
          return {
            ...userBlueprint,
            blueprint: blueprint || {
              id: userBlueprint.blueprintId,
              title: 'Blueprint not found',
              description: 'This blueprint may have been deleted or is temporarily unavailable.',
              brand: 'Unknown',
              model: 'Unknown',
              images: []
            }
          };
        })
      );

      setUserBlueprints(detailedBlueprints);
    } catch (err) {
      setError('Failed to fetch blueprints');
      console.error('Error fetching user blueprints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBlueprint = async (id: number) => {
    try {
      const token = authService.getToken();
      await axios.delete(`http://localhost:5002/api/UserOfBlueprint/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      await fetchUserBlueprints(); // Refresh list after deletion
    } catch (err) {
      setError('Failed to remove blueprint');
      console.error('Error removing blueprint:', err);
    }
  };

  useEffect(() => {
    fetchUserBlueprints();
  }, []);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="My Blueprints" />

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black dark:text-white">
                My Selected Blueprints
              </h2>
              <a
                href="/printify/blueprints"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
              >
                Add New Blueprint
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 text-danger px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Blueprints Grid */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="p-6.5">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {userBlueprints.map((userBlueprint) => (
                      <div key={userBlueprint.id} className="border rounded-lg overflow-hidden">
                        {userBlueprint.blueprint && userBlueprint.blueprint.images && userBlueprint.blueprint.images.length > 0 ? (
                          <img
                            src={userBlueprint.blueprint.images[0]}
                            alt={userBlueprint.blueprint.title}
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
                          <h3 className="font-semibold text-lg mb-2">
                            {userBlueprint.blueprint?.title || 'Unknown Blueprint'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Brand: {userBlueprint.blueprint?.brand || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mb-4">
                            Model: {userBlueprint.blueprint?.model || 'N/A'}
                          </p>
                          <button
                            onClick={() => handleRemoveBlueprint(userBlueprint.id)}
                            className="w-full px-4 py-2 bg-danger text-white rounded hover:bg-danger/90 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isLoading && userBlueprints.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No blueprints selected yet. Click "Add New Blueprint" to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MyBlueprints; 