// ========== 控件属性与方法分析 ==========
// 只抓取text("送到家")的控件，输出其常用属性和方法
let btn = text("送到家").findOne(3000); // 最多等3秒
if (btn) {
    console.log(`text=送到家, clickable=${btn.clickable()}, enabled=${btn.enabled()}, selected=${btn.selected()}, id=${btn.id()}, desc=${btn.desc()}`);
    let methods = Object.getOwnPropertyNames(btn.__proto__).filter(
        k => typeof btn[k] === 'function' && (k.toLowerCase().includes('refresh') || k.toLowerCase().includes('update'))
    );
    console.log("refresh/update相关方法:", methods);
} else {
    console.log('未找到text(\"送到家\")的控件');
}

// // ========== 按钮属性分析 ==========
// // 说明：分析页面上两个按钮的属性，便于后续自动化操作
// let btnA = className("Button").text("送到家").findOne();
// let btnB = className("Button").text("到点取").findOne();

// console.log("btnA clickable:", btnA.clickable());
// console.log("btnB clickable:", btnB.clickable());

// // ========== 方案1：通过系统广播触发刷新 ==========
// // 说明：需要目标APP支持特定广播，通常需要root权限
// try {
//     shell("am broadcast -a com.example.REFRESH_ACTION", true);
//     console.log("已尝试发送刷新广播");
// } catch (e) {
//     console.log("发送广播异常:", e);
// }

// // ========== 方案2：调用页面内部方法 ==========
// // 说明：需反编译分析目标APP，找到可用的刷新方法
// try {
//     runtime.accessibility({
//         action: "callMethod",
//         packageName: "com.example.app",
//         className: "com.example.MainActivity",
//         methodName: "forceRefresh"
//     });
//     console.log("已尝试调用页面内部刷新方法");
// } catch (e) {
//     console.log("调用页面方法异常:", e);
// }

// // ========== 方案3：模拟完整交互流程 ==========
// // 说明：通过切换按钮实现页面刷新，适用于部分需要状态切换的场景
// function smartRefresh() {
//     let currentBtn = className("Button").selected(true).findOne();
//     let targetBtn = currentBtn.text() == "送到家" ? btnB : btnA;
//     targetBtn.click();
//     sleep(300);
//     currentBtn.click();
//     console.log("已模拟按钮切换刷新");
// }

// // ========== 方案4：RootAutomator无痕点击 ==========
// // 说明：需要root权限，直接模拟物理点击
// try {
//     let ra = new RootAutomator();
//     ra.tap(btnA.bounds().centerX(), btnA.bounds().centerY());
//     ra.tap(btnB.bounds().centerX(), btnB.bounds().centerY(), 100); // 100ms间隔
//     ra.close();
//     console.log("已用RootAutomator无痕点击按钮");
// } catch (e) {
//     console.log("RootAutomator异常:", e);
// }

// ========== 关键点说明 ==========
// 1. 可用className("Button")等方式抓取控件，分析其属性和方法
// 2. 若能抓到refresh/update相关方法，可直接调用
// 3. 监控点击事件后的网络请求，分析是否有隐藏刷新机制
// 4. 检查是否依赖页面滑动、手势等物理交互 