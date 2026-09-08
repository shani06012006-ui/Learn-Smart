// frontend/src/components/common/Input.jsx

/**
 * Input Component - Reusable form input with label and error
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.name - Input name
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Required field
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {React.ReactNode} props.rightIcon - Icon on the right
 */
const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  icon,
  rightIcon,
  as = 'input',
  rows = 3,
  ...props
}) => {
  const inputClasses = `
    w-full px-4 py-2 border rounded-lg bg-white
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    transition-all duration-200
    ${error ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${icon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

  const InputElement = as === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <InputElement
          id={name}
          name={name}
          type={as === 'input' ? type : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={as === 'textarea' ? rows : undefined}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};

export default Input;