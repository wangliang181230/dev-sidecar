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

    // 验证码图片识别的执行间隔
    // 说明：按需手动调整此配置值，如果觉得识别过快，可以将间隔调大点
    let interval = 100; // 单位：毫秒


    let img;
    let count = 0;
    let startTime = null;
    let endTime = null;
    let enable = false;
    let minBase64Length = 6000; // 当前站点的验证码图片base64最小长度，避免无效的识别请求
    let curInterval = interval; // 当前执行间隔
    let lastText;

    // 获取输入框
    function getInput () {
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
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
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
            img.onload = function () {
                if (!img) return;

                if (startTime == null) curInterval = 0;
                setTimeout(function () {
                    if (!img) return;
                    console.info('--------------------------------------------------------------');
                    debug('验证码图片刷新完成了');
                    doParse();
                }, curInterval);
                curInterval = interval;
            };
        }
        if (!img.onerror) {
            img.onerror = function () {
                if (!img) return;
                console.info('--------------------------------------------------------------');
                warn('验证码图片加载失败了，重新加载验证码');
                flushImg(img);
            };
        }

        // 发现图片，首次执行
        if (startTime === null) {
            setTimeout(function () {
                if (startTime === null) doParse();
            }, 2000);
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
            //info('imageBase64.length:', imageBase64.length);
            if (!imageBase64 || imageBase64.length < minBase64Length) {
                return debug('图片未加载完成，暂不识别！');
            }
            if (img.base64) return debug('正在识别图片，不重复发起识别');
            imageBase64 = encodeURIComponent(imageBase64);
            img.base64 = imageBase64;
            count++;
            fetchParse(imageBase64);
        } catch(e) {
            warn('验证码识别出现异常：', e);
            return flushImg();
        }
    }

    function fetchParse (imageBase64) {
        fetch('/baiduOcr?' + imageBase64, { method: 'POST' }).then(response => {
            debug('<-- 调用图片识别接口完成：', response.status);

            if (img && img.base64 !== imageBase64) return warn('图片已变更，丢弃此次识别结果');
            if (!enable || !img) {
                img.base64 = null;
                return;
            }

            if (!response.ok) {
                warn('图片识别接口报错：', response);
                return flushImg();
            }
            response.json().then(data => {
                if (data.error_code) {
                    warn(`调用了图片识别接口，但接口报错了：code: ${data.error_code}, msg: ${data.error_msg}`);

                    if (data.error_code === 99917) {
                        stop();
                        try {
                            showMsg(data.error_msg + '现停止识别验证码！');
                        } catch(e) {
                        }

                        return;
                    } else if (data.error_code === 17) {
                        return fetchParse(imageBase64); // 所使用的百度云账号已达到每日请求限制，重新发起识别请求
                    } else {
                        return flushImg();
                    }
                }

                if (!data.words_result || data.words_result.length === 0) {
                    //debug('图片识别结果中，没有数字：', decodeURIComponent(imageBase64));
                    debug('图片识别结果中，没有数字：图片base64长度 =', decodeURIComponent(imageBase64).length);
                    return flushImg();
                }

                // data 格式如：{"words_result":[{"words":"652"}],"words_result_num":1,"log_id":1818914384408222200}
                const originText = data.words_result[0].words;
                if (!originText) {
                    debug('识别结果为空：', originText);
                    return flushImg();
                }

                // 替换部分字符（注：当前站点的验证码，没有0、1、9，碰到这几个数字需要替换掉）
                let text = originText.replaceAll(/[.,]/g, '')

                  .replaceAll('香', '35')
                  .replaceAll('对', '44')
                  .replaceAll(/[多名号]/g, '45')
                  .replaceAll('龙', '46')
                  .replaceAll('刘', '47')
                  .replaceAll('哈', '47')
                  .replaceAll(/[么年]/g, '72')
                  .replaceAll('方', '75')
                  .replaceAll(/[入何]/g, '77')
                  .replaceAll('的', '83')

                  .replaceAll(/[q9%÷<=\-]/g, '2')
                  .replaceAll(/[ANtxXyY*×:又双]/g, '4')
                  .replaceAll(/[sSgG分台白]/g, '5')
                  .replaceAll(/[b]/g, '6')
                  .replaceAll(/[1lnT|>~/\\]/g, '7')
                  .replaceAll(/[B]/g, '8')
                  .replaceAll(/[oO°。]/g, '0')
                ;
                while (text.includes('0')) {
                    const idx = text.indexOf('0');
                    if (idx <= 2) {
                        text = text.replace('0', '8');
                    } else {
                        text = text.replace('0', '5');
                    }
                }
                const len = text.length;
                text = text.replaceAll(/\D/g, ''); // 移除非数字字符
                if (text.length !== 4 && text.length !== len) {
                    const warnMsg = `重要：当前识别结果，存在未转换字符：${originText}    请将此日志复制并发送给研发人员，以提高识别率！！！当前图片Base64：data:image/png;base64,${decodeURIComponent(imageBase64)}`;
                    warn(warnMsg);
                    //alert(warnMsg);
                }
                if (!text) {
                    debug('识别结果不是数字：', originText);
                    return flushImg();
                }

                while (text.length < 4) {
                    text += '7'; // 7经常识别漏，所以补7
                }
                if (!text.match('^\\d{4}$')) {
                    debug('识别结果不是4位数字：', originText);
                    return flushImg();
                }

                if (text !== originText) {
                    warn(`识别结果不正确：${originText}，转换后尝试提交：${text}`);
                } else {
                    info(`识别结果为4位数字：${text}，尝试提交验证`); // 输出验证码识别结果
                }

                // 自动填入验证码
                const input = getInput();
                if (!input) {
                    warn('未找到验证码输入框，无法自动填入验证码：', text);
                    alert('程序未找到验证码输入框，无法自动填入验证码');
                    img.base64 = null;
                    return;
                }
                input.value = text;
                input.dispatchEvent(new Event('input'));

                // 自动点击按钮
                let btn = getBtn();
                if (!btn) {
                    btn = document.querySelector('button.btn-login.ant-btn.ant-btn-primary');
                }
                if (!btn) {
                    warn('未找到“确定”按钮，无法提交验证码：', text);
                    alert('程序未找到“确定”按钮，无法提交验证码');
                    img.base64 = null;
                    return;
                }

                curInterval = 600 + interval;
                lastText = text;
                btn.click();

                img.base64 = null;
                endTime = Date.now();

                setTimeout(function () {
                    checkBtnClick(text);
                }, 500);
            });
        }).catch(error => {
            warn('验证码识别过程中出错：', error);
            return flushImg();
        });
    }

    function checkBtnClick (text) {
        if (document.querySelector('p.after-title') || location.hash === '#/home') {
            checkResult(text);
            return;
        }

        const errorMsgElement = document.querySelector('.ant-message .ant-message-error');
        if (errorMsgElement) {
            const errorMsg = errorMsgElement.innerText;
            if (!errorMsg) return;

            if (errorMsg.indexOf('验证码错误') >= 0) {
                warn('提交了验证码，但验证码错误，识别结果不正确：', text);
            } else if (errorMsg.indexOf('该锚位已在') === 0 || errorMsg.indexOf('如要申请请联系') > 0) {
                warn(`提交了验证码 ${text}，但该锚位已被其他人抢走了，停止识别验证码，有需要时再按F2开启！！！  错误信息：${errorMsg}`);

                // 停止识别验证码
                stop();

                // 提示已被抢走
                try {
                    showMsg(`很遗憾，该锚位已被其他人抢走了，停止识别验证码，有需要时再按F2开启！！！！！！此次尝试识别验证码图片次数：${count} 次，总计耗时：${(endTime - startTime) / 1000} 秒`);
                } catch(e) {
                }
                count = 0;
                startTime = null;
                endTime = null;
            } else {
                warn(`提交了验证码 ${text}，但失败了，错误信息：${errorMsg}`);
            }
        } else {
            warn(`提交了验证码 ${text}，但未找到执行结果信息，不知道是成功还是失败！（这可能是由于提交请求响应时间超过 500 ms，或者页面卡住了导致错误信息未及时弹出，大部分情况属于正常现象！）`);
        }
    }

    function start () {
        if (window.qmwInterval || enable) return;

        enable = true;
        lastText = null;
        info('>>> 开始抢锚位！！！');
        window.qmwInterval = setInterval(checkDoParse, 100);
    }
    function stop () {
        if (!window.qmwInterval || !enable) return;

        enable = false;
        lastText = null;
        clearInterval(window.qmwInterval);
        window.qmwInterval = null;
        count = 0;
        startTime = null;
        endTime = null;
        lastText = null;
        info('--- 停止抢锚位！！！');
    }


    function logTime () {
        const time = new Date();
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        const seconds = String(time.getSeconds()).padStart(2, '0');
        const milliseconds = String(time.getMilliseconds()).padStart(3, '0');

        return `${hours}:${minutes}:${seconds}.${milliseconds}   `;
    }
    function log (args) {
        let str = logTime();
        for (let i = 0; i < args.length; i++) {
            str += ' ' + args[i];
        }
        return str;
    }
    function debug () {
        console.debug(log(arguments));
    }
    function info () {
        console.info(log(arguments));
    }
    function warn () {
        console.warn(log(arguments));
    }
    function showMsg (msg) {
        warn(msg);

        try {
            if (window.Notification) {
                // 检查通知权限
                if (Notification.permission === 'granted') {
                    // 如果权限已经被授予
                    new Notification(msg);
                } else if (Notification.permission !== 'denied') {
                    // 如果权限没有被拒绝，向用户请求权限
                    Notification.requestPermission().then(function (permission) {
                        if (permission === 'granted') {
                            new Notification(msg);
                        }
                    });
                }
            }
        } catch(e) {}

        setTimeout(function () { alert(msg); }, 1000);
    }

    function checkResult (text) {
        if (count === 0 || endTime === null) return false;

        let title;
        let logFun;

        const successElement = document.querySelector('p.after-title');
        if (successElement && successElement.innerText && successElement.innerText.indexOf('成功') > 0) {
            title = '抢锚位成功啦！！！';
            logFun = showMsg;
        } else if (location.hash === '#/home') {
            title = '登录成功啦！！！';
            logFun = showMsg;
        } else {
            title = `很遗憾，${ location.hash === '#/login' ? '登录' : '抢锚位' }未能成功。`;
            logFun = warn;
        }

        try {
            text = text || lastText;
            logFun(`${title}此次尝试识别验证码图片次数：${count} 次，总计耗时：${(endTime - startTime) / 1000} 秒${text ? `，验证码为：${text}` : ''}`);
        } catch(e) {
        }
        count = 0;
        startTime = null;
        endTime = null;
        lastText = null;
        return true;
    }

    // 绑定键盘事件，用于启停程序
    window.addEventListener('keyup', function (event) {
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
            Notification.requestPermission().then(r => info('“消息通知” 功能授权结果：' + r));
        }
    }

    start();
})();