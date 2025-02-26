"use client";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import AddMockupModal from "./AddMockupModal";
import { useRouter } from 'next/navigation';
import { authService } from "@/services/authService";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { favoriteService, FavoriteList, Mockup } from "@/services/favoriteService";

const FavoritePage = () => {
  const router = useRouter();
  const [lists, setLists] = useState<FavoriteList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [newListCategory, setNewListCategory] = useState("");
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingListIds, setDeletingListIds] = useState<number[]>([]);
  const [addingMockupToListId, setAddingMockupToListId] = useState<number | null>(null);
  const [removingMockupIds, setRemovingMockupIds] = useState<{listId: number, mockupId: number}[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'list' | 'mockup';
    listId: number;
    mockupId?: number;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'list',
    listId: 0,
    title: '',
    message: ''
  });

  const fetchLists = async () => {
    try {
      const newLists = await favoriteService.getLists();
      setLists(newLists);
      setError(null);
    } catch (error) {
      console.error("Error fetching lists:", error);
      setError("Failed to load favorite lists. Please try again.");
      if (error instanceof Error && error.message === 'No authentication token found') {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMockups = async () => {
    try {
      const userId = authService.getCurrentUser()?.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Kullanıcıya özel mockupları getir
      const newMockups = await favoriteService.getMockups();
      setMockups(newMockups);
    } catch (error) {
      console.error("Error fetching mockups:", error);
      setError("Failed to load mockups. Please try again.");
      if (error instanceof Error && error.message === 'No authentication token found') {
        router.push('/login');
      }
    }
  };

  const createList = async () => {
    if (!newListName.trim() || !newListCategory.trim()) {
      setError("Please fill in both list name and category");
      return;
    }

    // Declare optimisticList outside try block
    const optimisticList: FavoriteList = {
      id: Date.now(), // temporary ID
      name: newListName,
      category: newListCategory,
      mockups: []
    };

    try {
      setIsCreating(true);
      setError(null);

      // Optimistic update
      setLists(prev => [...prev, optimisticList]);

      await favoriteService.createList(newListName, newListCategory);
      setNewListName("");
      setNewListCategory("");
      await fetchLists(); // Refresh to get the real ID
    } catch (error) {
      // Revert optimistic update
      setLists(prev => prev.filter(list => list.id !== optimisticList.id));
      console.error("Error creating list:", error);
      setError("Failed to create list. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: number) => {
    setDeleteModal({
      isOpen: true,
      type: 'list',
      listId,
      title: 'Delete List',
      message: 'Are you sure you want to delete this list? This action cannot be undone.'
    });
  };

  const handleDeleteMockup = (listId: number, mockupId: number) => {
    setDeleteModal({
      isOpen: true,
      type: 'mockup',
      listId,
      mockupId,
      title: 'Remove Mockup',
      message: 'Are you sure you want to remove this mockup from the list? This action cannot be undone.'
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteModal.type === 'list') {
        setDeletingListIds(prev => [...prev, deleteModal.listId]);
        
        // Optimistic update
        const deletedList = lists.find(list => list.id === deleteModal.listId);
        setLists(prev => prev.filter(list => list.id !== deleteModal.listId));

        try {
          await favoriteService.deleteList(deleteModal.listId);
        } catch (error) {
          // Revert optimistic update on error
          if (deletedList) {
            setLists(prev => [...prev, deletedList]);
          }
          throw error;
        }
      } else if (deleteModal.type === 'mockup' && deleteModal.mockupId) {
        await removeMockupFromList(deleteModal.listId, deleteModal.mockupId);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      setError(deleteModal.type === 'list' ? "Failed to delete list" : "Failed to remove mockup");
    } finally {
      setDeletingListIds(prev => prev.filter(id => id !== deleteModal.listId));
    }
  };

  const addMockupToList = async (listId: number, mockupIds: number[]) => {
    try {
      setAddingMockupToListId(listId);
      await favoriteService.addMockupsToList(listId, mockupIds);
      await fetchLists();
    } catch (error) {
      console.error("Error adding mockups to list:", error);
      setError("Failed to add mockups to list. Please try again.");
    } finally {
      setAddingMockupToListId(null);
    }
  };

  const removeMockupFromList = async (listId: number, mockupId: number) => {
    try {
      setRemovingMockupIds(prev => [...prev, { listId, mockupId }]);
      
      // Optimistic update
      setLists(prevLists => 
        prevLists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              mockups: list.mockups.filter(m => m.id !== mockupId)
            };
          }
          return list;
        })
      );

      await favoriteService.removeMockupFromList(listId, mockupId);
    } catch (error) {
      console.error("Error removing mockup from list:", error);
      setError("Failed to remove mockup from list");
      await fetchLists(); // Revert changes by refreshing
    } finally {
      setRemovingMockupIds(prev => 
        prev.filter(item => !(item.listId === listId && item.mockupId === mockupId))
      );
    }
  };

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      fetchLists();
      fetchMockups();
    } else {
      router.push('/login');
    }
  }, []);

  return (
    <DefaultLayout>
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <Breadcrumb pageName="Favorites" />
        
        {error && (
          <div className="mb-4 rounded-lg bg-danger bg-opacity-10 px-4 py-3 text-danger">
            {error}
          </div>
        )}
        
        <div className="flex flex-col gap-10">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Create New Favorite List
              </h3>
            </div>
            <div className="p-6.5">
              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  List Name
                </label>
                <input
                  type="text"
                  placeholder="Enter list name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5">
                <label className="mb-2.5 block text-black dark:text-white">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Enter category"
                  value={newListCategory}
                  onChange={(e) => setNewListCategory(e.target.value)}
                  className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                />
              </div>

              <button
                onClick={createList}
                disabled={isCreating}
                className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90 disabled:opacity-50"
              >
                {isCreating ? (
                  <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Create List'}
              </button>
            </div>
          </div>

          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-4 py-4 dark:border-strokedark sm:px-6.5">
              <h3 className="font-medium text-black dark:text-white">
                Your Favorite Lists
              </h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : lists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg
                  className="mb-4 h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h3 className="mb-1 text-xl font-medium text-black dark:text-white">
                  No Favorite Lists Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create your first favorite list to start organizing your mockups
                </p>
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-2 text-left dark:bg-meta-4">
                      <th className="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
                        List Name
                      </th>
                      <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                        Category
                      </th>
                      <th className="px-4 py-4 font-medium text-black dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lists.map((list) => (
                      <tr key={list.id}>
                        <td className="border-b border-[#eee] px-4 py-5 pl-9 xl:pl-11">
                          <h5 className="font-medium text-black dark:text-white">
                            {list.name}
                          </h5>
                          {list.mockups && list.mockups.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              {list.mockups.map((mockup) => (
                                <span
                                  key={mockup.id}
                                  className="inline-flex items-center gap-2 rounded-md bg-gray-2 px-3 py-1 text-sm font-medium text-black dark:bg-meta-4 dark:text-white"
                                >
                                  {mockup.name}
                                  <button
                                    onClick={() => handleDeleteMockup(list.id, mockup.id)}
                                    disabled={removingMockupIds.some(item => item.listId === list.id && item.mockupId === mockup.id)}
                                    className="text-meta-1 hover:text-meta-1 disabled:opacity-50"
                                  >
                                    {removingMockupIds.some(item => item.listId === list.id && item.mockupId === mockup.id) ? (
                                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                      </svg>
                                    ) : (
                                      "×"
                                    )}
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5">
                          <p className="text-black dark:text-white">
                            {list.category?.trim() || '-'}
                          </p>
                        </td>
                        <td className="border-b border-[#eee] px-4 py-5">
                          <div className="flex items-center space-x-3.5">
                            <button
                              onClick={() => {
                                setSelectedListId(list.id);
                                setIsModalOpen(true);
                              }}
                              disabled={addingMockupToListId === list.id}
                              className="hover:text-primary disabled:opacity-50"
                              title="Add Mockup"
                            >
                              {addingMockupToListId === list.id ? (
                                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg
                                  className="fill-current"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M9 3.75V14.25M14.25 9H3.75"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteList(list.id)}
                              disabled={deletingListIds.includes(list.id)}
                              className="hover:text-meta-1 disabled:opacity-50"
                              title="Delete List"
                            >
                              {deletingListIds.includes(list.id) ? (
                                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg
                                  className="fill-current"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565ZM11.7285 16.2563H6.27227C5.79414 16.2563 5.40039 15.8906 5.37227 15.3844L4.95039 6.2719H13.0785L12.6566 15.3844C12.6004 15.8625 12.2066 16.2563 11.7285 16.2563Z"
                                    fill=""
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddMockupModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedListId(null);
        }}
        onAdd={(mockupIds) => {
          if (selectedListId) {
            addMockupToList(selectedListId, mockupIds);
          }
        }}
        mockups={mockups}
        currentListMockups={lists.find(list => list.id === selectedListId)?.mockups.map(m => m.id) || []}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
      />
    </DefaultLayout>
  );
};

export default FavoritePage; 