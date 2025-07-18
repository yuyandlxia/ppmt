/**
 * 泡泡玛特微信小程序抢购脚本
 * 基于 Hamibot 控件操作 API
 * 作者：AI Assistant
 * 版本：1.1 Hamibot 兼容版
 *
 * 功能说明：
 * 1. 自动打开微信小程序
 * 2. 自动搜索并进入泡泡玛特商品页面
 * 3. 自动选择商品规格
 * 4. 自动添加到购物车
 * 5. 自动结算下单
 *
 * 注意事项：
 * - 需要提前收藏泡泡玛特小程序
 * - 已登录微信且设置好地址、支付方式
 * - 保持网络畅通
 */

/* ==========  基础 API  ========== */
/* =====  兼容所有 Hamibot 版本的 API 获取  ===== */

// 检查 hamibot 对象是否存在
if (typeof hamibot === 'undefined') {
    throw new Error('Hamibot 环境未检测到，请确保在 Hamibot 中运行此脚本');
}

// 安全地获取 API 函数，如果不存在则提供 fallback
var findText      = hamibot.findText || function() { return null; };
var findDesc      = hamibot.findDesc || function() { return null; };
var findId        = hamibot.findId || function() { return null; };
var findClassName = hamibot.findClassName || function() { return null; };
var click         = hamibot.click || function() { return null; };
var swipe         = hamibot.swipe || function() { return null; };
var sleep         = hamibot.sleep || function(time) { 
    var start = Date.now();
    while (Date.now() - start < time) {
        // 简单的等待实现
    }
};
var toast         = hamibot.toast || function(msg) { console.log('TOAST: ' + msg); };
var log           = hamibot.log || function(msg) { console.log(msg); };

// 验证关键 API 是否可用
if (!findText || !findDesc || !click || !sleep) {
    throw new Error('Hamibot API 初始化失败，请检查 Hamibot 版本和权限设置');
}


/* ==========  配置  ========== */
var CONFIG = {
    PRODUCT_KEYWORDS : ['泡泡玛特', '盲盒', '手办'],
    WAIT_TIME : {
        SHORT     : 1000,
        MEDIUM    : 2000,
        LONG      : 5000,
        VERY_LONG : 10000
    },
    MAX_RETRY : 3,
    SWIPE_CONFIG : {
        DURATION : 500,
        STEPS    : 10
    },
    LOG_CONFIG : {
        ENABLE_DEBUG        : true,
        ENABLE_ERROR_DETAILS: true,
        LOG_TO_FILE         : false,
        LOG_LEVEL           : 'INFO'
    }
};

/* ==========  全局统计  ========== */
var ERROR_STATS = {
    total_errors   : 0,
    errors_by_type : {},
    last_error     : null,
    error_history  : []
};

/* ==========  工具函数  ========== */
function logMessage(message, level, details) {
    level   = level || 'info';
    details = details || null;

    var timestamp = new Date().toLocaleTimeString();
    var logText   = '[' + timestamp + '] [' + level.toUpperCase() + '] ' + message;

    if (level === 'error') {
        ERROR_STATS.total_errors += 1;
        ERROR_STATS.last_error = {
            message   : message,
            timestamp : timestamp,
            details   : details
        };
        if (details && details.type) {
            var t = details.type;
            ERROR_STATS.errors_by_type[t] = (ERROR_STATS.errors_by_type[t] || 0) + 1;
        }
        ERROR_STATS.error_history.push({
            message   : message,
            timestamp : timestamp,
            details   : details
        });
        if (ERROR_STATS.error_history.length > 50) {
            ERROR_STATS.error_history.shift();
        }
    }

    if (CONFIG.LOG_CONFIG.ENABLE_DEBUG || level !== 'debug') {
        // 安全地调用 log 函数
        if (typeof log === 'function') {
            switch (level) {
                case 'error':
                    log(logText);
                    if (CONFIG.LOG_CONFIG.ENABLE_ERROR_DETAILS && details) {
                        log('错误详情: ' + JSON.stringify(details, null, 2));
                    }
                    break;
                case 'warn':
                    log(logText);
                    break;
                default:
                    log(logText);
            }
        } else {
            // 如果 log 函数不可用，使用 console.log 作为 fallback
            console.log(logText);
        }
        
        // 安全地调用 toast 函数
        if (level === 'error' || level === 'warn') {
            if (typeof toast === 'function') {
                toast('[' + level.toUpperCase() + '] ' + message);
            }
        }
    }
}

/* 检查网络连接 */
function checkNetworkConnection() {
    try {
        // 简单的网络检查，可以根据需要扩展
        logMessage('检查网络连接...', 'debug');
        return true;
    } catch (e) {
        logMessage('网络连接检查失败: ' + e.message, 'error');
        return false;
    }
}

/* 检查微信状态 */
function checkWechatStatus() {
    try {
        logMessage('检查微信应用状态...', 'debug');
        // 这里可以添加更详细的微信状态检查逻辑
        return true;
    } catch (e) {
        logMessage('微信状态检查失败: ' + e.message, 'error');
        return false;
    }
}

/* 统一把默认参数转换成传统写法 */
function safeSleep(time, reason) {
    time   = time || 1000;
    reason = reason || '';
    logMessage('等待 ' + time + 'ms (' + reason + ')', 'debug');
    sleep(time);
}

/* 查找并点击文本 */
function findAndClickText(text, timeout, options) {
    timeout = timeout || 5000;
    options = options || {};
    var retryCount = options.retryCount || 0;
    var maxRetries = options.maxRetries || 1;

    logMessage('查找并点击文本: ' + text + ' (尝试 ' + (retryCount + 1) + '/' + (maxRetries + 1) + ')', 'debug');

    var startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        var element = findText(text);
        if (element) {
            element.click();
            logMessage('成功点击文本: ' + text, 'info');
            return true;
        }
        safeSleep(500, '等待文本出现');
    }

    logMessage('未找到文本: ' + text, 'warn');
    if (retryCount < maxRetries) {
        safeSleep(CONFIG.WAIT_TIME.MEDIUM, '重试前等待');
        options.retryCount = retryCount + 1;
        return findAndClickText(text, timeout, options);
    }
    return false;
}

/* 查找并点击描述 */
function findAndClickDesc(desc, timeout, options) {
    timeout = timeout || 5000;
    options = options || {};
    var retryCount = options.retryCount || 0;
    var maxRetries = options.maxRetries || 1;

    logMessage('查找并点击描述: ' + desc + ' (尝试 ' + (retryCount + 1) + '/' + (maxRetries + 1) + ')', 'debug');

    var startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        var element = findDesc(desc);
        if (element) {
            element.click();
            logMessage('成功点击描述: ' + desc, 'info');
            return true;
        }
        safeSleep(500, '等待描述出现');
    }

    logMessage('未找到描述: ' + desc, 'warn');
    if (retryCount < maxRetries) {
        safeSleep(CONFIG.WAIT_TIME.MEDIUM, '重试前等待');
        options.retryCount = retryCount + 1;
        return findAndClickDesc(desc, timeout, options);
    }
    return false;
}

/* 查找并点击 ID */
function findAndClickId(id, timeout, options) {
    timeout = timeout || 5000;
    options = options || {};
    var retryCount = options.retryCount || 0;
    var maxRetries = options.maxRetries || 1;

    logMessage('查找并点击 ID: ' + id + ' (尝试 ' + (retryCount + 1) + '/' + (maxRetries + 1) + ')', 'debug');

    var startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        var element = findId(id);
        if (element) {
            element.click();
            logMessage('成功点击 ID: ' + id, 'info');
            return true;
        }
        safeSleep(500, '等待 ID 出现');
    }

    logMessage('未找到 ID: ' + id, 'warn');
    if (retryCount < maxRetries) {
        safeSleep(CONFIG.WAIT_TIME.MEDIUM, '重试前等待');
        options.retryCount = retryCount + 1;
        return findAndClickId(id, timeout, options);
    }
    return false;
}

/* 查找并点击类名 */
function findAndClickClassName(className, timeout, options) {
    timeout = timeout || 5000;
    options = options || {};
    var retryCount = options.retryCount || 0;
    var maxRetries = options.maxRetries || 1;

    logMessage('查找并点击类名: ' + className + ' (尝试 ' + (retryCount + 1) + '/' + (maxRetries + 1) + ')', 'debug');

    var startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        var element = findClassName(className);
        if (element) {
            element.click();
            logMessage('成功点击类名: ' + className, 'info');
            return true;
        }
        safeSleep(500, '等待类名出现');
    }

    logMessage('未找到类名: ' + className, 'warn');
    if (retryCount < maxRetries) {
        safeSleep(CONFIG.WAIT_TIME.MEDIUM, '重试前等待');
        options.retryCount = retryCount + 1;
        return findAndClickClassName(className, timeout, options);
    }
    return false;
}

/* ==========  业务步骤  ========== */
function openWechatMiniProgram() {
    logMessage('开始打开微信小程序...', 'info');
    if (!checkWechatStatus()) {
        throw new Error('微信应用状态异常');
    }
    var methods = [
        function() { return findAndClickText('微信', 3000, {maxRetries:1}); },
        function() { return findAndClickDesc('微信', 3000, {maxRetries:1}); },
        function() { return findAndClickId('com.tencent.mm:id/icon', 3000, {maxRetries:1}); },
        function() { return findAndClickClassName('android.widget.ImageView', 3000, {maxRetries:1}); }
    ];
    for (var i = 0; i < methods.length; i++) {
        if (methods[i]()) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待微信启动');
            return true;
        }
    }
    throw new Error('无法打开微信，请确保已安装且无障碍服务已启用');
}

function searchPopmartMiniProgram() {
    logMessage('搜索泡泡玛特小程序...', 'info');
    var searchBoxFound =
        findAndClickText('搜索', 5000, {maxRetries:2}) ||
        findAndClickDesc('搜索', 5000, {maxRetries:2});
    if (!searchBoxFound) throw new Error('未找到搜索框');

    safeSleep(CONFIG.WAIT_TIME.SHORT, '等待搜索框激活');

    var searchKeywords = ['泡泡玛特', 'POP MART', '盲盒'];
    for (var j = 0; j < searchKeywords.length; j++) {
        logMessage('尝试搜索: ' + searchKeywords[j], 'info');
        safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待输入完成');
        if (findAndClickText('搜索', 3000) || findAndClickDesc('搜索', 3000)) {
            safeSleep(CONFIG.WAIT_TIME.LONG, '等待搜索结果');
            return true;
        }
    }
    throw new Error('搜索失败，请检查网络和小程序名称');
}

function enterProductDetail() {
    logMessage('进入商品详情页...', 'info');
    var selectors = ['商品', '详情', '查看', '购买', '立即购买'];
    for (var k = 0; k < selectors.length; k++) {
        if (findAndClickText(selectors[k], 3000, {maxRetries:1}) ||
            findAndClickDesc(selectors[k], 3000, {maxRetries:1})) {
            safeSleep(CONFIG.WAIT_TIME.LONG, '等待商品页面加载');
            return true;
        }
    }
    throw new Error('无法进入商品详情页，请检查库存');
}

function selectProductSpec() {
    logMessage('选择商品规格...', 'info');
    var specs = ['规格', '选择', '型号', '款式'];
    for (var m = 0; m < specs.length; m++) {
        if (findAndClickText(specs[m], 3000, {maxRetries:1}) ||
            findAndClickDesc(specs[m], 3000, {maxRetries:1})) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待规格界面');
            if (findAndClickText('确定', 2000) || findAndClickDesc('确定', 2000)) {
                safeSleep(CONFIG.WAIT_TIME.SHORT, '等待规格确认');
                return true;
            }
        }
    }
    logMessage('无需选择规格或选择失败', 'warn');
    return false;
}

function addToCart() {
    logMessage('添加到购物车...', 'info');
    var cartBtns = ['加入购物车', '添加到购物车', '加购', '购物车'];
    for (var n = 0; n < cartBtns.length; n++) {
        if (findAndClickText(cartBtns[n], 3000, {maxRetries:1}) ||
            findAndClickDesc(cartBtns[n], 3000, {maxRetries:1})) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待购物车操作');
            return true;
        }
    }
    throw new Error('无法添加到购物车');
}

function buyNow() {
    logMessage('立即购买...', 'info');
    var buyBtns = ['立即购买', '马上购买', '购买', '下单'];
    for (var p = 0; p < buyBtns.length; p++) {
        if (findAndClickText(buyBtns[p], 3000, {maxRetries:1}) ||
            findAndClickDesc(buyBtns[p], 3000, {maxRetries:1})) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待购买操作');
            return true;
        }
    }
    throw new Error('无法立即购买');
}

function confirmOrder() {
    logMessage('确认订单...', 'info');
    safeSleep(CONFIG.WAIT_TIME.LONG, '等待订单页面');
    var confirms = ['确认订单', '提交订单', '立即支付', '支付'];
    for (var q = 0; q < confirms.length; q++) {
        if (findAndClickText(confirms[q], 5000, {maxRetries:2}) ||
            findAndClickDesc(confirms[q], 5000, {maxRetries:2})) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待订单确认');
            return true;
        }
    }
    throw new Error('无法确认订单');
}

function handlePayment() {
    logMessage('处理支付...', 'info');
    safeSleep(CONFIG.WAIT_TIME.LONG, '等待支付页面');
    var methods = ['微信支付', '支付宝', '银行卡'];
    for (var r = 0; r < methods.length; r++) {
        if (findAndClickText(methods[r], 3000, {maxRetries:1}) ||
            findAndClickDesc(methods[r], 3000, {maxRetries:1})) {
            safeSleep(CONFIG.WAIT_TIME.MEDIUM, '等待支付方式');
            break;
        }
    }
    if (findAndClickText('确认支付', 5000, {maxRetries:2}) ||
        findAndClickDesc('确认支付', 5000, {maxRetries:2})) {
        logMessage('支付确认成功！', 'info');
        return true;
    }
    throw new Error('支付处理失败');
}

/* ==========  主流程  ========== */
function printErrorStats() {
    logMessage('=== 错误统计 ===', 'info');
    logMessage('总错误数: ' + ERROR_STATS.total_errors, 'info');
    for (var type in ERROR_STATS.errors_by_type) {
        logMessage('  ' + type + ': ' + ERROR_STATS.errors_by_type[type] + '次', 'info');
    }
    logMessage('================', 'info');
}

function mainGrabProcess() {
    logMessage('开始泡泡玛特抢购流程...', 'info');
    try {
        if (!checkNetworkConnection()) throw new Error('网络异常');
        if (!openWechatMiniProgram())  throw new Error('无法打开微信小程序');
        if (!searchPopmartMiniProgram()) throw new Error('无法搜索小程序');
        if (!enterProductDetail()) throw new Error('无法进入商品页');

        selectProductSpec();

        if (!buyNow()) {
            if (!addToCart()) throw new Error('无法购买商品');
        }
        if (!confirmOrder()) throw new Error('无法确认订单');
        if (!handlePayment()) throw new Error('支付失败');

        logMessage('抢购流程完成！', 'info');
    } catch (e) {
        logMessage('抢购失败: ' + e.message, 'error');
        printErrorStats();
        throw e;
    }
}

function main() {
    logMessage('泡泡玛特抢购脚本启动', 'info');
    logMessage('请确保微信已登录、网络正常、收货地址及支付方式已设置、小程序已收藏', 'info');
    safeSleep(CONFIG.WAIT_TIME.VERY_LONG, '用户准备时间');

    try {
        mainGrabProcess();
        printErrorStats();
    } catch (e) {
        logMessage('脚本执行失败: ' + e.message, 'error');
        printErrorStats();
    }
}

/* ==========  启动  ========== */
logMessage('API 初始化成功', 'info');
main();