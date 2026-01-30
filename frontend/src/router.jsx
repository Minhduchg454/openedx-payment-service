import { createBrowserRouter } from "react-router-dom";
import { Checkout } from "./pages/Checkout";
import { ResultCheckout } from "./pages/ResultCheckout";
import { path } from "./utils/path";

export const router = createBrowserRouter([
  {
    path: path.checkout,
    element: <Checkout />,
  },
  {
    path: path.result,
    element: <ResultCheckout />,
  },
]);
