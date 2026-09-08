// frontend/src/components/common/Alert.jsx

import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

/**
 * Alert Component - Reusable alert messages
 * 
 * @param {Object} props
 * @param {string} props.type - Alert type (success, error, warning, info)
 * @param {string} props.title - Alert title
 * @param {string} props.message - Alert message
 * @param {function} props.onClose - Close handler
 * @param {string} props.className - Additional CSS classes
 */
const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className = '',
  ...props 
}) => {
  const types = {
    success: {
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-800',
      icon: CheckCircleIcon,
      iconColor: 'text-success-500',
    },
    error: {
      bg: 'bg-danger-50',
      border: 'border-danger-200',
      text: 'text-danger-800',
      icon: XCircleIcon,
      iconColor: 'text-danger-500',
    },
    warning: {
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-800',
      icon: ExclamationCircleIcon,
      iconColor: 'text-warning-500',
    },
    info: {
      bg: 'bg-info-50',
      border: 'border-info-200',
      text: 'text-info-800',
      icon: InformationCircleIcon,
      iconColor: 'text-info-500',
    },
  };

  const { bg, border, text, icon: Icon, iconColor } = types[type] || types.info;

  return (
    <div 
      className={`rounded-lg border p-4 ${bg} ${border} ${text} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {message && <p className="text-sm mt-0.5">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;