export const SelectableCardList = ({
  items,
  value,
  onChange,
  disabled,
  itemClassName = "",
}) => {
  return (
    <div className="flex gap-6">
      {items.map((item) => {
        const active = value === item.id;

        return (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (disabled) return;
              onChange(item.id);
            }}
            className={`flex flex-col gap-1 justify-center items-center cursor-pointer ${itemClassName}`}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded border p-1
                ${active ? "border-cusc_blue" : "border-transparent"}
                 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {item.icon && (
                <img
                  src={item.icon}
                  alt={item.label}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  draggable={false}
                />
              )}
            </div>

            <p
              className={`text-sm ${
                active ? "text-cusc_blue font-medium" : "text-gray-700"
              }`}
            >
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
};
