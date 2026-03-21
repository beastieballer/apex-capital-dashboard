import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import './VideoClipper.css';

const CLIP_DURATION_OPTIONS = [10, 12, 15];
const ASPECT_RATIOS = [
  { label: '9:16 (TikTok / IG Reels)', value: '9:16', w: 1080, h: 1920 },
  { label: '1:1 (Instagram Square)', value: '1:1', w: 1080, h: 1080 },
  { label: '4:5 (Instagram Portrait)', value: '4:5', w: 1080, h: 1350 },
  { label: '16:9 (Landscape)', value: '16:9', w: 1920, h: 1080 },
];

export default function VideoClipper() {
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const ffRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [clipDuration, setClipDuration] = useState(15);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [clips, setClips] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentClip, setCurrentClip] = useState(0);
  const [logs, setLogs] = useState([]);
  const videoRef = useRef(null);

  const addLog = msg => setLogs(l => [...l.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const loadFFmpeg = useCallback(async () => {
    setFfmpegLoading(true);
    setLoadError('');
    addLog('Loading FFmpeg WebAssembly...');
    try {
      const ff = new FFmpeg();
      ff.on('log', ({ message }) => addLog(message));
      ff.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)));

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ff.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffRef.current = ff;
      setFfmpegLoaded(true);
      addLog('FFmpeg loaded successfully ✓');
    } catch (e) {
      setLoadError(`Failed to load FFmpeg: ${e.message}`);
      addLog(`Error: ${e.message}`);
    } finally {
      setFfmpegLoading(false);
    }
  }, []);

  const handleVideoFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      addLog('Error: Please select a video file');
      return;
    }
    setVideo(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setClips([]);
    addLog(`Loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setVideoDuration(dur);
      const count = Math.floor(dur / clipDuration);
      addLog(`Video duration: ${dur.toFixed(1)}s → ${count} clip${count !== 1 ? 's' : ''} at ${clipDuration}s each`);
    }
  };

  const processClips = async () => {
    if (!ffmpegLoaded || !video) return;
    setProcessing(true);
    setClips([]);
    setProgress(0);

    const ff = ffRef.current;
    const totalClips = Math.floor(videoDuration / clipDuration);
    const ar = aspectRatio;

    addLog(`Starting: ${totalClips} clips, ${ar.label}, ${ar.w}×${ar.h}`);

    try {
      const inputName = 'input.mp4';
      await ff.writeFile(inputName, await fetchFile(video));
      addLog('Video written to FFmpeg filesystem');

      const newClips = [];

      for (let i = 0; i < totalClips; i++) {
        const startTime = i * clipDuration;
        const outName = `clip_${i + 1}.mp4`;
        setCurrentClip(i + 1);
        addLog(`Processing clip ${i + 1}/${totalClips} (${startTime}s – ${startTime + clipDuration}s)...`);

        // Crop + scale to target aspect ratio
        const cropFilter = ar.value === '16:9'
          ? `scale=${ar.w}:${ar.h}:force_original_aspect_ratio=decrease,pad=${ar.w}:${ar.h}:(ow-iw)/2:(oh-ih)/2:black`
          : `crop=min(iw\\,ih*${ar.w}/${ar.h}):min(ih\\,iw*${ar.h}/${ar.w}),scale=${ar.w}:${ar.h}`;

        await ff.exec([
          '-ss', String(startTime),
          '-i', inputName,
          '-t', String(clipDuration),
          '-vf', cropFilter,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '23',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-movflags', '+faststart',
          '-y',
          outName,
        ]);

        const data = await ff.readFile(outName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        newClips.push({
          id: i + 1,
          url,
          blob,
          filename: `reel_${String(i + 1).padStart(2, '0')}_${startTime}s.mp4`,
          startTime,
          duration: clipDuration,
          size: (blob.size / 1024 / 1024).toFixed(2),
        });
        setClips([...newClips]);
        await ff.deleteFile(outName);
        setProgress(Math.round(((i + 1) / totalClips) * 100));
      }

      await ff.deleteFile(inputName);
      addLog(`Done! ${totalClips} reels ready for download`);
    } catch (e) {
      addLog(`Error: ${e.message}`);
    } finally {
      setProcessing(false);
      setCurrentClip(0);
    }
  };

  const downloadClip = (clip) => {
    const a = document.createElement('a');
    a.href = clip.url;
    a.download = clip.filename;
    a.click();
  };

  const downloadAll = () => clips.forEach((c, i) => setTimeout(() => downloadClip(c), i * 300));

  const clipCount = videoDuration ? Math.floor(videoDuration / clipDuration) : 0;

  return (
    <div className="container vc-page">
      <div className="page-header">
        <h1>Reel Cutter</h1>
        <p>Chop long videos into TikTok & Instagram reels — runs entirely in your browser</p>
      </div>

      <div className="vc-layout">
        <div className="vc-main">
          {/* Load FFmpeg */}
          {!ffmpegLoaded && (
            <div className="vc-section card">
              <div className="vc-section-header">
                <h3>Step 1 — Initialize Video Engine</h3>
              </div>
              <p className="vc-desc">
                FFmpeg runs entirely in your browser via WebAssembly. No video is uploaded to any server.
                First load downloads ~30MB of WASM binaries.
              </p>
              {loadError && <div className="vc-error">{loadError}</div>}
              <button className="btn-primary" onClick={loadFFmpeg} disabled={ffmpegLoading}>
                {ffmpegLoading ? (
                  <><div className="spinner" style={{ display: 'inline-block', width: 14, height: 14, marginRight: 8 }} />Loading Engine...</>
                ) : 'Load FFmpeg Engine'}
              </button>
            </div>
          )}

          {/* Upload video */}
          {ffmpegLoaded && (
            <div className="vc-section card">
              <div className="vc-section-header">
                <h3>Step 2 — Upload Your Video</h3>
                <span className="badge badge-green">Engine Ready</span>
              </div>
              <div className="vc-drop" onClick={() => document.getElementById('video-upload').click()}>
                <input id="video-upload" type="file" accept="video/*" onChange={handleVideoFile} style={{ display: 'none' }} />
                {video ? (
                  <div className="vc-file-info">
                    <span className="vc-file-icon">▶</span>
                    <div>
                      <p className="vc-file-name">{video.name}</p>
                      <p className="vc-file-meta">
                        {(video.size / 1024 / 1024).toFixed(1)} MB
                        {videoDuration ? ` · ${Math.floor(videoDuration / 60)}m ${Math.floor(videoDuration % 60)}s` : ''}
                        {clipCount > 0 ? ` · ${clipCount} clips` : ''}
                      </p>
                    </div>
                    <span className="vc-change">Change</span>
                  </div>
                ) : (
                  <>
                    <span className="vc-drop-icon">📹</span>
                    <p>Click to select a video file</p>
                    <span className="vc-drop-hint">MP4, MOV, AVI, MKV supported</span>
                  </>
                )}
              </div>

              {videoUrl && (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  onLoadedMetadata={handleVideoLoaded}
                  className="vc-preview"
                />
              )}
            </div>
          )}

          {/* Settings */}
          {video && ffmpegLoaded && (
            <div className="vc-section card">
              <div className="vc-section-header">
                <h3>Step 3 — Clip Settings</h3>
              </div>

              <div className="vc-settings">
                <div className="vc-setting">
                  <label>Clip Duration</label>
                  <div className="duration-btns">
                    {CLIP_DURATION_OPTIONS.map(d => (
                      <button key={d} className={`duration-btn ${clipDuration === d ? 'active' : ''}`}
                        onClick={() => setClipDuration(d)}>
                        {d}s
                      </button>
                    ))}
                  </div>
                  {clipCount > 0 && (
                    <p className="vc-count-hint">
                      → <strong>{clipCount} reels</strong> from {Math.floor(videoDuration / 60)}m {Math.floor(videoDuration % 60)}s of video
                      {videoDuration % clipDuration > 0 && ` (${(videoDuration % clipDuration).toFixed(1)}s remainder discarded)`}
                    </p>
                  )}
                </div>

                <div className="vc-setting">
                  <label>Aspect Ratio</label>
                  <div className="ar-options">
                    {ASPECT_RATIOS.map(ar => (
                      <button key={ar.value}
                        className={`ar-btn ${aspectRatio.value === ar.value ? 'active' : ''}`}
                        onClick={() => setAspectRatio(ar)}>
                        <span className="ar-ratio">{ar.value}</span>
                        <span className="ar-label">{ar.label.split('(')[1]?.replace(')', '') || ar.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary vc-process-btn"
                onClick={processClips}
                disabled={processing || clipCount === 0}
              >
                {processing
                  ? `Processing clip ${currentClip} of ${clipCount}...`
                  : `Cut ${clipCount} Reel${clipCount !== 1 ? 's' : ''} →`}
              </button>

              {processing && (
                <div className="vc-progress">
                  <div className="vc-progress-bar">
                    <div className="vc-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span>{progress}%</span>
                </div>
              )}
            </div>
          )}

          {/* Clips output */}
          {clips.length > 0 && (
            <div className="vc-section card">
              <div className="vc-section-header">
                <h3>{clips.length} Reels Ready</h3>
                <button className="btn-primary" onClick={downloadAll}>Download All</button>
              </div>
              <div className="clips-grid">
                {clips.map(clip => (
                  <div key={clip.id} className="clip-card">
                    <video src={clip.url} controls className="clip-video" />
                    <div className="clip-info">
                      <p className="clip-name">Reel #{clip.id}</p>
                      <p className="clip-meta">{clip.startTime}s · {clip.size} MB</p>
                    </div>
                    <button className="btn-outline clip-dl" onClick={() => downloadClip(clip)}>
                      ↓ Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Log panel */}
        <div className="vc-sidebar">
          <div className="card vc-log-panel">
            <div className="vc-log-header">
              <h4>Activity Log</h4>
              <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setLogs([])}>Clear</button>
            </div>
            <div className="vc-log-body">
              {logs.length === 0
                ? <p className="vc-log-empty">No activity yet</p>
                : logs.map((l, i) => <p key={i} className="vc-log-line">{l}</p>)
              }
            </div>
          </div>

          <div className="card vc-tips">
            <h4>Tips</h4>
            <ul>
              <li>TikTok & IG Reels work best at <strong>9:16</strong> (vertical)</li>
              <li><strong>15s</strong> clips perform well for tattoo process videos</li>
              <li>Hook viewers in the <strong>first 3 seconds</strong></li>
              <li>All processing is <strong>private</strong> — no upload to servers</li>
              <li>Add music in TikTok/IG after uploading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
