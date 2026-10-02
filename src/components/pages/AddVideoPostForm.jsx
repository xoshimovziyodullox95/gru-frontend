import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Film,
  Play,
  RotateCcw,
  Send,
  UploadCloud,
  X,
} from 'lucide-react';

import { createVideoPost } from '../services/videos';
import '../../styles/addVideoForm.css';

const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 MB';
  }

  const megabytes = bytes / (1024 * 1024);

  return `${megabytes.toFixed(
    megabytes >= 10 ? 0 : 1
  )} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

export default function AddVideoPostForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fileInputRef = useRef(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [videoPreview, setVideoPreview] =
    useState('');

  const [videoMeta, setVideoMeta] =
    useState({
      duration: 0,
      width: 0,
      height: 0,
    });

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [isDragging, setIsDragging] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [error, setError] = useState('');

  /* Object URL xotirasini tozalash */

  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setVideoFile(null);
    setVideoPreview('');
    setVideoMeta({
      duration: 0,
      width: 0,
      height: 0,
    });
    setError('');
    resetFileInput();
  };

  const selectVideo = (file) => {
    if (!file) return;

    if (!file.type?.startsWith('video/')) {
      setError(
        t(
          'addVideo.errors.videoOnly',
          'Faqat video fayl yuklash mumkin'
        )
      );
      resetFileInput();
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      setError(
        t(
          'addVideo.errors.fileTooLarge',
          'Video hajmi 100 MB dan oshmasligi kerak'
        )
      );
      resetFileInput();
      return;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    const objectUrl = URL.createObjectURL(file);

    setError('');
    setUploadProgress(0);
    setVideoMeta({
      duration: 0,
      width: 0,
      height: 0,
    });
    setVideoFile(file);
    setVideoPreview(objectUrl);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    selectVideo(file);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (uploading) return;

    const file = event.dataTransfer.files?.[0];
    selectVideo(file);
  };

  const handleVideoMetadata = (event) => {
    const video = event.currentTarget;

    setVideoMeta({
      duration: video.duration || 0,
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    });
  };

  const openFilePicker = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!videoFile) {
      setError(
        t(
          'addVideo.errors.videoRequired',
          'Iltimos, video tanlang'
        )
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();

      formData.append('video', videoFile);
      formData.append(
        'title',
        title.trim() || 'Video'
      );
      formData.append(
        'description',
        description.trim()
      );

      await createVideoPost(
        formData,
        (progressEvent) => {
          if (!progressEvent.total) return;

          const progress = Math.round(
            (progressEvent.loaded * 100) /
              progressEvent.total
          );

          setUploadProgress(
            Math.min(progress, 100)
          );
        }
      );

      setUploadProgress(100);

      window.setTimeout(() => {
        navigate('/home', {
          replace: true,
        });
      }, 350);
    } catch (requestError) {
      console.error(
        'Video yuklash xatosi:',
        requestError
      );

      const message =
        requestError?.response?.data?.error ||
        t(
          'addVideo.errors.uploadFailed',
          'Video yuklashda xatolik yuz berdi'
        );

      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const isPortrait =
    videoMeta.width > 0 &&
    videoMeta.height > videoMeta.width;

  return (
    <main className="avf-page">
      <header className="avf-page-header">
        <button
          type="button"
          className="avf-back-btn"
          onClick={() => navigate(-1)}
          disabled={uploading}
        >
          <ArrowLeft size={18} />

          <span>
            {t('common.back', 'Orqaga')}
          </span>
        </button>

        <div className="avf-page-heading">
          <span className="avf-eyebrow">
            G.R.U Reels
          </span>

          <h1 className="avf-title">
            {t(
              'addVideo.title',
              'Yangi video'
            )}
          </h1>

          <p className="avf-subtitle">
            {t(
              'addVideo.subtitle',
              'Videongizni ulashing va yangi auditoriyaga yetib boring'
            )}
          </p>
        </div>
      </header>

      <form
        className="avf-form"
        onSubmit={handleSubmit}
      >
        <div className="avf-layout">
          {/* Video qismi */}

          <section className="avf-media-column">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading}
              hidden
            />

            {!videoPreview ? (
              <button
                type="button"
                className={`avf-upload-box ${
                  isDragging
                    ? 'is-dragging'
                    : ''
                }`}
                onClick={openFilePicker}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={uploading}
              >
                <span className="avf-upload-icon">
                  <UploadCloud
                    size={34}
                    strokeWidth={1.7}
                  />
                </span>

                <span className="avf-upload-title">
                  {t(
                    'addVideo.selectVideo',
                    'Video tanlang'
                  )}
                </span>

                <span className="avf-upload-description">
                  {t(
                    'addVideo.dragDrop',
                    'Videoni shu yerga tashlang yoki tanlash uchun bosing'
                  )}
                </span>

                <span className="avf-upload-limit">
                  MP4, WebM, MOV · maksimum 100 MB
                </span>
              </button>
            ) : (
              <div className="avf-preview-card">
                <video
                  src={videoPreview}
                  className="avf-preview-video"
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={
                    handleVideoMetadata
                  }
                />

                <div
                  className="avf-preview-gradient"
                  aria-hidden="true"
                />

                <div className="avf-preview-top">
                  <span className="avf-preview-badge">
                    <Play
                      size={12}
                      fill="currentColor"
                    />
                    Reels
                  </span>

                  <button
                    type="button"
                    className="avf-remove-btn"
                    onClick={clearVideo}
                    disabled={uploading}
                    aria-label={t(
                      'addVideo.removeVideo',
                      'Videoni olib tashlash'
                    )}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="avf-preview-bottom">
                  <strong>
                    {title.trim() ||
                      t(
                        'addVideo.previewTitle',
                        'Video sarlavhasi'
                      )}
                  </strong>

                  {description.trim() && (
                    <p>{description.trim()}</p>
                  )}
                </div>
              </div>
            )}

            {videoFile && (
              <div className="avf-file-info">
                <div className="avf-file-icon">
                  <Film size={19} />
                </div>

                <div className="avf-file-details">
                  <strong>{videoFile.name}</strong>

                  <span>
                    {formatFileSize(
                      videoFile.size
                    )}

                    {videoMeta.duration > 0 &&
                      ` · ${formatDuration(
                        videoMeta.duration
                      )}`}
                  </span>
                </div>

                {videoMeta.width > 0 && (
                  <span
                    className={`avf-orientation ${
                      isPortrait
                        ? 'is-portrait'
                        : ''
                    }`}
                  >
                    {isPortrait
                      ? t(
                          'addVideo.portrait',
                          '9:16 mos'
                        )
                      : t(
                          'addVideo.landscape',
                          'Gorizontal'
                        )}
                  </span>
                )}
              </div>
            )}
          </section>

          {/* Ma’lumotlar qismi */}

          <section className="avf-fields-column">
            <div className="avf-section-heading">
              <div className="avf-section-icon">
                <Film size={20} />
              </div>

              <div>
                <h2>
                  {t(
                    'addVideo.detailsTitle',
                    'Video ma’lumotlari'
                  )}
                </h2>

                <p>
                  {t(
                    'addVideo.detailsSubtitle',
                    'Tomoshabinlar uchun qisqacha ma’lumot kiriting'
                  )}
                </p>
              </div>
            </div>

            <div className="avf-field">
              <div className="avf-label-row">
                <label htmlFor="avf-title">
                  {t(
                    'addVideo.fields.title',
                    'Sarlavha'
                  )}
                </label>

                <span>
                  {title.length}/
                  {MAX_TITLE_LENGTH}
                </span>
              </div>

              <input
                id="avf-title"
                type="text"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                disabled={uploading}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder={t(
                  'addVideo.fields.titlePlaceholder',
                  'Videongiz haqida qisqacha'
                )}
              />
            </div>

            <div className="avf-field">
              <div className="avf-label-row">
                <label htmlFor="avf-description">
                  {t(
                    'addVideo.fields.description',
                    'Tavsif'
                  )}
                </label>

                <span>
                  {description.length}/
                  {MAX_DESCRIPTION_LENGTH}
                </span>
              </div>

              <textarea
                id="avf-description"
                value={description}
                maxLength={
                  MAX_DESCRIPTION_LENGTH
                }
                disabled={uploading}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder={t(
                  'addVideo.fields.descriptionPlaceholder',
                  'Batafsil tavsif yozing...'
                )}
                rows={6}
              />
            </div>

            {!isPortrait &&
              videoMeta.width > 0 && (
                <div className="avf-tip">
                  <AlertCircle size={18} />

                  <span>
                    {t(
                      'addVideo.portraitTip',
                      'Reels uchun 9:16 vertikal video yaxshiroq ko‘rinadi.'
                    )}
                  </span>
                </div>
              )}

            {error && (
              <div
                className="avf-error"
                role="alert"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {uploading && (
              <div className="avf-progress">
                <div className="avf-progress-header">
                  <span>
                    {t(
                      'addVideo.uploading',
                      'Video yuklanmoqda'
                    )}
                  </span>

                  <strong>
                    {uploadProgress}%
                  </strong>
                </div>

                <div className="avf-progress-track">
                  <div
                    className="avf-progress-fill"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="avf-actions">
              {videoFile && !uploading && (
                <button
                  type="button"
                  className="avf-change-btn"
                  onClick={openFilePicker}
                >
                  <RotateCcw size={17} />

                  <span>
                    {t(
                      'addVideo.changeVideo',
                      'Almashtirish'
                    )}
                  </span>
                </button>
              )}

              <button
                type="submit"
                className="avf-submit-btn"
                disabled={
                  uploading || !videoFile
                }
              >
                {uploading ? (
                  <>
                    <span className="avf-spinner" />
                    <span>
                      {t(
                        'addVideo.uploading',
                        'Yuklanmoqda'
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Send size={18} />

                    <span>
                      {t(
                        'addVideo.publish',
                        'Joylashtirish'
                      )}
                    </span>
                  </>
                )}
              </button>
            </div>

            {uploadProgress === 100 &&
              !error && (
                <div className="avf-success">
                  <CheckCircle2 size={18} />
                  <span>
                    {t(
                      'addVideo.success',
                      'Video muvaffaqiyatli yuklandi'
                    )}
                  </span>
                </div>
              )}
          </section>
        </div>
      </form>
    </main>
  );
}