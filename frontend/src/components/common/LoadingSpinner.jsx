// frontend/src/components/common/LoadingSpinner.jsx

/**
 * LoadingSpinner Component - Reusable loading spinner
 * 
 * @param {Object} props
 * @param {string} props.size - Size (sm, md, lg, xl)
 * @param {string} props.color - Color variant (primary, white, gray)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Loading text to display
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = '',
  ...props 
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
    xl: 'h-16 w-16 border-4',
  };

  const colors = {
    primary: 'border-primary-200 border-t-primary-600',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      <div
        className={`
          ${sizes[size] || sizes.md}
          ${colors[color] || colors.primary}
          rounded-full animate-spin
        `}
      />
      {text && <p className="mt-3 text-sm text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;