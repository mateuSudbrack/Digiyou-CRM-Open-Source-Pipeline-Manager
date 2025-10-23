import React from 'react';
import Modal from './Modal';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, onClose, htmlContent }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Preview">
      <div className="bg-white rounded-md overflow-hidden border border-gray-600">
        <iframe
          srcDoc={htmlContent}
          title="Email Preview"
          className="w-full h-[60vh] border-none"
          sandbox="allow-same-origin" // For security, prevent scripts unless necessary
        />
      </div>
       <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                Close
            </button>
        </div>
    </Modal>
  );
};

export default EmailPreviewModal;
