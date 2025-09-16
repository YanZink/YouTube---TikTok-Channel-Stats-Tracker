import React, { useState } from 'react';
import { X } from 'lucide-react';
import './AddChannelModal.css';

const AddChannelModal = ({ onClose, onChannelAdded }) => {
  const [platform, setPlatform] = useState('youtube');
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  // URL validation function - domains or @handle only
  const validateUrl = (url, platform) => {
    if (!url.trim()) return 'URL is required';

    const patterns = {
      youtube: [
        /^(https?:\/\/)?(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+$/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+$/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+$/,
        /^@[a-zA-Z0-9_-]+$/, // only @channelname
      ],
      tiktok: [
        /^(https?:\/\/)?(www\.)?tiktok\.com\/@[a-zA-Z0-9_-]+$/,
        /^@[a-zA-Z0-9_-]+$/, // only @username
      ],
    };

    const isValid = patterns[platform].some((pattern) =>
      pattern.test(url.trim())
    );

    if (!isValid) {
      return platform === 'youtube'
        ? 'Invalid format. Use: https://youtube.com/@channelname or @channelname'
        : 'Invalid format. Use: https://tiktok.com/@username or @username';
    }

    return '';
  };

  const handleUrlChange = (e) => {
    const value = e.target.value;
    setChannelUrl(value);
    setValidationError(validateUrl(value, platform));
  };

  const handlePlatformChange = (e) => {
    const newPlatform = e.target.value;
    setPlatform(newPlatform);
    setValidationError(validateUrl(channelUrl, newPlatform));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrorMsg = validateUrl(channelUrl, platform);
    if (validationErrorMsg) {
      setValidationError(validationErrorMsg);
      return;
    }

    setError('');
    setValidationError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${
          process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
        }/channels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform,
            url: channelUrl.trim(),
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || responseData.details || 'Failed to add channel'
        );
      }

      console.log('✅ Channel added successfully:', responseData);

      if (typeof onChannelAdded === 'function') {
        onChannelAdded(responseData);
      }

      setChannelUrl('');

      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      setError(`Error adding channel: ${error.message}`);
      console.error('❌ Error adding channel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Channel</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="platform">Platform</label>
            <select
              id="platform"
              value={platform}
              onChange={handlePlatformChange}
              className="form-select"
            >
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="channel-url">Channel URL or Handle</label>
            <input
              id="channel-url"
              type="text"
              value={channelUrl}
              onChange={handleUrlChange}
              placeholder={
                platform === 'youtube'
                  ? 'https://youtube.com/@channelname or @channelname'
                  : 'https://tiktok.com/@username or @username'
              }
              className="form-input"
              required
            />
            <small className="form-hint">
              Enter the full URL or handle starting with @
            </small>
            {validationError && (
              <div className="validation-error">{validationError}</div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || validationError}
          >
            {loading ? 'Adding...' : 'Add Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddChannelModal;
