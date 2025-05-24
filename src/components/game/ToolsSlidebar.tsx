import React, { useState } from "react";
import { FaLightbulb } from "react-icons/fa";

interface ToolsSidebarProps {
  clue: string;
}

const ToolsSidebar: React.FC<ToolsSidebarProps> = ({ clue }) => {
  const [showClue, setShowClue] = useState(false);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-gray-100 h-full">
      {/* Other tool icons here */}
      <button
        className="text-yellow-500 hover:text-yellow-600"
        onClick={() => setShowClue(true)}
        title="Show Clue"
        aria-label="Show Clue"
      >
        <FaLightbulb size={28} />
      </button>

      {/* Clue Popup */}
      {showClue && (
        <>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg border">
              <h2 className="font-bold mb-2">Clue</h2>
              <p>{clue}</p>
              <button
              
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                onClick={() => setShowClue(false)}
              >
                Close
              </button>
            </div>
          </div>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black opacity-30 z-40"
            onClick={() => setShowClue(false)}
          />
        </>
      )}
    </div>
  );
};

export default ToolsSidebar;
