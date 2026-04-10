export interface FormFieldProps {
  label: string;
  name?: string;
  required?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}

export function FormField({ label, name, required, error, helper, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && helper && <p className="text-sm text-gray-400">{helper}</p>}
    </div>
  );
}

/** 通用 input 樣式 */
export const inputClass =
  'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors';

export const selectClass = inputClass;

export const textareaClass = `${inputClass} resize-y`;
