import { CloseButton } from "../components";

export const BankTransferQr = ({
  bankCode,
  bankName,
  accountNumber,
  accountName,
  amount,
  orderId,
  onConfirm,
  onCancel,
}) => {
  const params = new URLSearchParams({
    amount,
    addInfo: orderId,
  });

  const qrUrl = `https://img.vietqr.io/image/${bankCode}-${accountNumber}-qr_only.png?${params.toString()}`;

  return (
    <div className="relative bg-white rounded-xl p-6 w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-6 border">
      <CloseButton onClick={onCancel} className="top-3 right-3" />
      {/* LEFT: transfer info */}
      <div className="text-sm space-y-3">
        <h3 className="text-base font-semibold">Thông tin chuyển khoản</h3>

        <div>
          <p className="text-gray-500">Ngân hàng</p>
          <p className="font-medium">{bankName}</p>
        </div>

        <div>
          <p className="text-gray-500">Số tài khoản</p>
          <p className="font-medium">{accountNumber}</p>
        </div>

        <div>
          <p className="text-gray-500">Tên người nhận</p>
          <p className="font-medium">{accountName}</p>
        </div>

        <div>
          <p className="text-gray-500">Số tiền</p>
          <p className="font-semibold text-green-600">
            {Number(amount).toLocaleString("vi-VN")} VND
          </p>
        </div>

        <div>
          <p className="text-gray-500">Nội dung chuyển khoản</p>
          <p className="font-mono bg-gray-100 px-2 py-1 rounded">{orderId}</p>
        </div>
      </div>

      {/* RIGHT: QR */}
      <div className="flex flex-col items-center justify-center gap-4">
        <img src={qrUrl} alt="VietQR" className="w-52 h-52" />

        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-cusc_blue hover:bg-blue-600 text-white rounded-lg font-bold"
        >
          Đã chuyển khoản
        </button>

        <p className="text-xs text-gray-500 text-justify">
          Khóa học sẽ được kích hoạt sau khi xác nhận chuyển khoản.
          <br />
          Vui lòng lưu giữ chứng từ giao dịch để đối soát khi cần.
        </p>
      </div>
    </div>
  );
};
