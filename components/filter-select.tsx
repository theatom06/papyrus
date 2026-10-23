"use client";

import { Dropdown } from "./dropdown";

export type FilterOption = { value: string; count: number };

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <Dropdown
      label={label}
      value={value}
      placeholder={`All ${label.toLowerCase()}s`}
      onChange={onChange}
      options={[
        { value: "", label: `All ${label.toLowerCase()}s` },
        ...options.map((option) => ({
          value: option.value,
          label: option.value,
          meta: String(option.count),
        })),
      ]}
    />
  );
}
