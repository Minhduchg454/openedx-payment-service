export const OrderSummary = ({
  course,
  user,
  amount,
  currency,
  paymentMethod,
  paidAt,
  showPaidAt = false,
}) => {
  return (
    <dl className="w-full text-sm bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex justify-between">
        <dt className="text-gray-500">Khóa học</dt>
        <dd className="font-medium text-right">{course?.name}</dd>
      </div>

      <div className="flex justify-between">
        <dt className="text-gray-500">Học viên</dt>
        <dd className="font-medium text-right">{user}</dd>
      </div>

      {showPaidAt && paidAt && (
        <div className="flex justify-between">
          <dt className="text-gray-500">Ngày mua</dt>
          <dd className="font-medium text-right">
            {new Date(paidAt).toLocaleString("vi-VN")}
          </dd>
        </div>
      )}

      <div className="flex justify-between">
        <dt className="text-gray-500">Phương thức</dt>
        <dd className="font-medium text-right">{paymentMethod?.label}</dd>
      </div>

      <div className="flex justify-between">
        <dt className="text-gray-500">Tổng tiền</dt>
        <dd className="font-semibold text-right">
          {amount?.toLocaleString("vi-VN")} {currency}
        </dd>
      </div>
    </dl>
  );
};
