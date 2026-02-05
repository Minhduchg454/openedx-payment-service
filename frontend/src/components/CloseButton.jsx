// CloseButton.jsx
import { HiXMark } from "react-icons/hi2";

export const CloseButton = ({ onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`absolute p-0.5 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-600 hover:text-white text-gray-800 shadow transition ${className}`}
    >
      <HiXMark size={18} />
    </button>
  );
};
