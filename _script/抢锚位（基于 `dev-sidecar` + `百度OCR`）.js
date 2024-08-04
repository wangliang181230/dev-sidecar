// ==UserScript==
// @name         抢锚位（基于 `dev-sidecar` + `百度OCR`）
// @namespace    http://tampermonkey.net/
// @version      2024-07-29
// @description  try to take over the world!
// @author       You
// @match        https://zkpt.zj.msa.gov.cn/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=msa.gov.cn
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    let img;
    let count = 0;
    let startTime = null;
    let endTime = null;
    let enable = false;
    let minBase64Length = 4000; // 当前站点的验证码图片base64最小长度，避免无效的识别请求

    // 获取输入框
    function getInput() {
        return document.querySelector('input[placeholder="图片验证码"]');
    }
    // 获取提交按钮
    function getBtn () {
        return document.querySelector('.ant-modal-content button.ant-btn.ant-btn-primary')
    }
    // 获取验证码图片
    function getCaptchaImage () {
        return document.querySelector('img[alt="验证码"]');
    }
    // 解析图片为base64
    function parseImageBase64 (img) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return canvas.toDataURL('image/png').replace("data:image/png;base64,", "");
    }
    // 刷新图片验证码
    function flushImg () {
        if (img) {
            img.base64 = null;
            img.click();
        }
    }

    // 运行相关方法
    function checkDoParse () {
        if (!enable) {
            return;
        }

        img = getCaptchaImage();
        if (!img) {
            // 图片不存在时，检查执行结果
            checkResult();
            return;
        }

        // 绑定验证码刷新事件
        if (!img.onload) {
            img.onload = function() {
                if (!img) return;
                console.info('--------------------------------------------------------------');
                console.debug('刷新图片验证码');
                doParse(img);
            };
        }
        if (!img.onerror) {
            img.onerror = function() {
                if (!img) return;
                console.info('--------------------------------------------------------------');
                console.warn('验证码图片加载失败了，重新加载验证码');
                flushImg(img);
            };
        }

        // 发现图片，首次执行
        if (startTime === null) {
            doParse();
        }
    }
    function doParse () {
        if (!enable || !img) {
            return;
        }

        if (startTime == null) {
            startTime = Date.now();
        }

        try {
            let imageBase64 = parseImageBase64(img);
            //console.info("imageBase64.length:", imageBase64.length);
            if (!imageBase64 || imageBase64.length < minBase64Length) return;
            if (img.base64) return console.warn("正在识别图片，不重复发起识别");
            imageBase64 = encodeURIComponent(imageBase64);
            img.base64 = imageBase64;
            count++;
            fetchParse(imageBase64);
        } catch(e) {
            console.warn('验证码识别出现异常：', e);
            return flushImg();
        }
    }

    function fetchParse(imageBase64) {
        fetch('/baiduOcr?' + imageBase64, { method: 'POST' }).then(response => {
            console.debug('<-- 调用图片识别接口完成：', response.status);

            if (img && img.base64 !== imageBase64) return console.warn("图片已变更，丢弃此次识别结果");
            if (!enable || !img) {
                img.base64 = null;
                return;
            }

            if (!response.ok) {
                console.warn('图片识别接口报错：', response);
                return flushImg();
            }
            response.json().then(data => {
                if (data.error_code) {
                    console.warn(`调用图片识别接口，但是报错了：code: ${data.error_code}, msg: ${data.error_msg}`);
                    if (data.error_code === 17) {
                        return fetchParse(imageBase64); // 所使用的百度云账号已达到每日请求限制
                    } else {
                        return flushImg();
                    }
                }

                if (!data.words_result || data.words_result.length === 0) {
                    //console.debug('图片识别结果中，没有数字：', decodeURIComponent(imageBase64));
                    console.debug('图片识别结果中，没有数字：base64长度 =', decodeURIComponent(imageBase64).length);
                    return flushImg();
                }

                // data 格式如：{"words_result":[{"words":"652"}],"words_result_num":1,"log_id":1818914384408222200}
                const originText = data.words_result[0].words;
                const text = originText.replaceAll(/[^\d]/g, '');
                if (!text) {
                    console.debug('识别结果为空：', originText);
                    return flushImg();
                }

                if (!text.match('^\\d{4}$')) {
                    console.debug('识别结果不是4位数字：', text);
                    return flushImg();
                }

                console.info(`识别结果为4位数字：${text}，尝试提交验证`); // 输出验证码识别结果

                // 自动填入验证码
                var input = getInput();
                if (!input) {
                    console.warn('未找到验证码输入框，无法自动填入验证码：', text);
                    alert('程序未找到验证码输入框，无法自动填入验证码');
                    img.base64 = null;
                    return;
                }
                input.value = text;
                input.dispatchEvent(new Event('input'));

                // 自动点击按钮
                var btn = getBtn();
                if (!btn) {
                    btn = document.querySelector('button.btn-login.ant-btn.ant-btn-primary');
                }
                if (!btn) {
                    console.warn('未找到“确定”按钮，无法提交验证码：', text);
                    alert('程序未找到“确定”按钮，无法提交验证码');
                    img.base64 = null;
                    return;
                }

                btn.click();

                img.base64 = null;
                endTime = Date.now();

                setTimeout(function() {
                    if (document.querySelector('p.after-title') || location.hash === '#/home') {
                        checkResult();
                        return;
                    }

                    var errorMsgElement = document.querySelector('.ant-message .ant-message-error');
                    if (errorMsgElement) {
                        var errorMsg = errorMsgElement.innerText;
                        if (errorMsg && errorMsg.indexOf('验证码错误') >= 0) {
                            console.warn('提交了验证码，但验证码错误，识别结果不正确：', text);
                        } else {
                            console.warn(`提交了验证码 ${input.value}，但失败了，错误信息：${errorMsg}`);
                        }
                    }
                }, 500);
            });
        }).catch(error => {
            console.warn('验证码识别过程中出错：', error);
            return flushImg();
        });
    }

    function start () {
        if (window.qmwInterval || enable) return;

        enable = true;
        console.info('>>> 开始抢锚位！！！');
        checkDoParse();
        window.qmwInterval = setInterval(checkDoParse, 100);
    }
    function stop () {
        if (!window.qmwInterval || !enable) return;

        enable = false;
        clearInterval(window.qmwInterval);
        window.qmwInterval = null;
        console.info('--- 停止抢锚位！！！');
    }

    function showSuccess (msg) {
        console.warn(msg);

        try {
            if (window.Notification) {
                // 检查通知权限
                if (Notification.permission === 'granted') {
                    // 如果权限已经被授予
                    new Notification(msg);
                } else if (Notification.permission !== 'denied') {
                    // 如果权限没有被拒绝，向用户请求权限
                    Notification.requestPermission().then(function(permission) {
                        if (permission === 'granted') {
                            new Notification(msg);
                        }
                    });
                }
            }
        } catch(e) {}

        setTimeout(function() { alert(msg); }, 1000);
    }

    function checkResult () {
        if (count === 0 || endTime === null) return false;

        var title;
        var logFun;

        var successElement = document.querySelector('p.after-title');
        if (successElement && successElement.innerText && successElement.innerText.indexOf('成功') > 0) {
            title = '抢锚位成功啦！！！';
            logFun = showSuccess;
        } else if (location.hash === '#/home') {
            title = '登录成功啦！！！';
            logFun = showSuccess;
        } else {
            title = `很遗憾，${ location.hash === '#/login' ? '登录' : '抢锚位' }未能成功。`;
            logFun = console.warn;
        }

        try {
            logFun(`${title}此次尝试识别验证码图片次数：${count} 次，总计耗时：${(endTime - startTime) / 1000} 秒`);
        } catch(e) {
        }
        count = 0;
        startTime = null;
        endTime = null;
        return true;
    }

    // 绑定键盘事件，用于启停程序
    window.addEventListener('keyup', function(event) {
        if (event.key === 'F2') {
            if (enable) {
                stop();
                alert('停止识别图片验证码');
            } else {
                alert('开始识别图片验证码');
                start();
            }
        }
    });

    if (window.Notification) {
        if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }

    start();
})();