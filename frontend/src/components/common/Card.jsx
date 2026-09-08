// frontend/src/components/common/Card.jsx


/**
 * Card Component - Reusable card container with consistent styling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effect
 * @param {boolean} props.clickable - Add cursor pointer
 * @param {function} props.onClick - Click handler
 * @param {string} props.padding - Padding size (sm, md, lg, none)
 */
const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  clickable = false,
  onClick = null,
  padding = 'md',
  ...props 
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-white rounded-xl shadow-lg 
        ${paddingClasses[padding] || paddingClasses.md}
        ${hover ? 'hover:shadow-xl transition-shadow duration-300' : ''}
        ${clickable ? 'cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;