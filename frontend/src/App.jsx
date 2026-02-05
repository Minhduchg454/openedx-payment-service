import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useSelector } from "react-redux";
import { Modal } from "./components";

function App() {
  const { isShowModal, modalChildren } = useSelector((state) => state.app);

  return (
    <div>
      {isShowModal && <Modal>{modalChildren}</Modal>}
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
