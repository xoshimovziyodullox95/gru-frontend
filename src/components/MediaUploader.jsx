import { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function MediaUploader({ mediaFiles, setMediaFiles, uploading = false }) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video'
    }));
    setMediaFiles(prev => [...prev, ...newFiles]);
  };

  const removeMedia = (index) => {
    URL.revokeObjectURL(mediaFiles[index].preview);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="media-upload-area">
      <label className="upload-btn">
        <Upload size={20} /> Rasm yoki video yuklash
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
      </label>

      <div className="media-previews">
        {mediaFiles.map((mf, idx) => (
          <div key={idx} className="media-preview">
            {mf.type === 'image' ? 
              <img src={mf.preview} alt="preview" /> : 
              <video src={mf.preview} controls />}
            <button type="button" onClick={() => removeMedia(idx)} className="remove-media">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}