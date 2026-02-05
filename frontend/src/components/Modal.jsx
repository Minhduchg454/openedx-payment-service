import { useDispatch } from "react-redux";
import { hideModal } from "../store/app/appSlice";

export const Modal = ({ children }) => {
  const dispatch = useDispatch();

  return (
    <div
      onClick={() => dispatch(hideModal)}
      className="absolute inset-0 z-[9999]  bg-white/60  p-4  flex items-center justify-center"
    >
      {children}
    </div>
  );
};
