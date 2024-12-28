import { useState } from "react";

interface AddMockupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mockupId: number) => void;
  mockups: { id: number; name: string }[];
}

const AddMockupModal = ({
  isOpen,
  onClose,
  onAdd,
  mockups,
}: AddMockupModalProps) => {
  const [selectedMockupId, setSelectedMockupId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black bg-opacity-40">
      <div className="w-full max-w-xl rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-black dark:text-white">
            Add Mockup to List
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mt-8">
          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-black dark:text-white">
              Select Mockup
            </label>
            <select
              value={selectedMockupId || ""}
              onChange={(e) => setSelectedMockupId(Number(e.target.value))}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input"
            >
              <option value="">Select a mockup</option>
              {mockups.map((mockup) => (
                <option key={mockup.id} value={mockup.id}>
                  {mockup.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-md border border-stroke px-6 py-2.5 text-center font-medium hover:bg-opacity-90"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedMockupId) {
                  onAdd(selectedMockupId);
                  onClose();
                }
              }}
              disabled={!selectedMockupId}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:bg-opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMockupModal; 