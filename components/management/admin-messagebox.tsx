import React from 'react';
import MessageBox from '../common/MessageBox';

interface AdminMessageBoxProps {
  conversationId: string;
  clientName: string;
  className?: string;
  onBack?: () => void;
}

const AdminMessageBox: React.FC<AdminMessageBoxProps> = ({
  conversationId,
  clientName,
  className = '',
  onBack,
}) => {
  return (
    <MessageBox
      userType="admin"
      title={clientName}
      conversationId={conversationId}
      onBack={onBack}
      className={className}
    />
  );
};

export default AdminMessageBox;