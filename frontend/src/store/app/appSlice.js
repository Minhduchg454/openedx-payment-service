import { createSlice } from "@reduxjs/toolkit";

export const appSlice = createSlice({
  name: "app",
  initialState: {
    isLoading: false,
    isShowModal: false,
    modalChildren: null,
    isShowAlert: false,
    alertData: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    showModal: (state, action) => {
      state.isShowModal = true;
      state.modalChildren = action.payload;
    },
    hideModal: (state) => {
      state.isShowModal = false;
      state.modalChildren = null;
    },

    showAlert: (state, action) => {
      state.isShowAlert = true;
      state.alertData = action.payload;
    },
    hideAlert: (state) => {
      state.isShowAlert = false;
      state.alertData = null;
    },
  },
});

export const { setLoading, showModal, hideModal, showAlert, hideAlert } =
  appSlice.actions;

export default appSlice.reducer;
