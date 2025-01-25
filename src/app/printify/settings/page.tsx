"use client";

import React, { useState, useEffect } from 'react';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import axios from 'axios';
import { authService } from '@/services/authService';
import { API_URL } from '@/utils/apiConfig';

const PrintifySettings = () => {
  const [printifyApiKey, setPrintifyApiKey] = useState('');
  const [displayApiKey, setDisplayApiKey] = useState('');
  const [shopId, setShopId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchPrintifySettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/User/printify-settings`);
        if (response.data.printifyApiKey) {
          const apiKey = response.data.printifyApiKey;
          setPrintifyApiKey(apiKey);
          setDisplayApiKey(maskApiKey(apiKey));
        }
        if (response.data.shopId) {
          setShopId(response.data.shopId);
        }
      } catch (error) {
        setMessage({ text: 'Failed to load settings', type: 'error' });
      }
    };

    fetchPrintifySettings();
  }, []);

  const maskApiKey = (key: string) => {
    if (!key) return '';
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 4)}`;
  };

  const handlePrintifyApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/User/printify-api-key`, {
        printifyApiKey
      });
      setMessage({ text: 'API key updated successfully', type: 'success' });
      setDisplayApiKey(maskApiKey(printifyApiKey));
      setIsEditing(false);
      await syncShopId();
    } catch (error) {
      setMessage({ text: 'Failed to update API key', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const syncShopId = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/User/shop-id`);
      setShopId(response.data.shopId);
      setMessage({ text: 'Shop ID synchronized successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Failed to sync shop ID', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-270">
        <Breadcrumb pageName="Printify Settings" />

        <div className="grid grid-cols-1 gap-9">
          <div className="flex flex-col gap-9">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Printify Integration Settings
                </h3>
              </div>
              <div className="p-6.5">
                {message.text && (
                  <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                  </div>
                )}

                <div className="mb-4.5">
                  <label className="mb-2.5 block text-black dark:text-white">
                    API Key
                  </label>
                  {isEditing ? (
                    <form onSubmit={handlePrintifyApiKeySubmit} className="flex gap-4">
                      <input
                        type="text"
                        placeholder="Enter your Printify API key"
                        value={printifyApiKey}
                        onChange={(e) => setPrintifyApiKey(e.target.value)}
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                    </form>
                  ) : (
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={displayApiKey}
                        readOnly
                        className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4.5">
                  <label className="mb-2.5 block text-black dark:text-white">
                    Shop ID
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={shopId}
                      readOnly
                      className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={syncShopId}
                      className="inline-flex items-center justify-center rounded-md bg-primary px-10 py-3 text-center font-medium text-white hover:bg-opacity-90"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Syncing...' : 'Sync'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default PrintifySettings; 