import { ClipLoader } from "react-spinners";

export const Loading = () => {
  return (
    <div>
      <ClipLoader color="#000000" size={50} speedMultiplier={1.2} />
    </div>
  );
};
