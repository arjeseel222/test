import React from 'react';
import {createUploadWidget} from '@cloudinary/upload-widget';

const UploadWidget = ({ onUploadSuccess }) => {
  const uploadWidget = React.useMemo(() => {
    return createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        sources: ['local', 'url', 'camera'],
        multiple: false
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          console.log('Upload success! Public ID:', result.info.public_id);
          onUploadSuccess?.(result.info.secure_url);
        }
      }
    );
  }, [onUploadSuccess]);

  const handleUploadClick = React.useCallback(() => {
    uploadWidget.open();
  }, [uploadWidget]);

  return (
    <button 
      onClick={handleUploadClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Upload Image
    </button>
  );
};

export default UploadWidget;