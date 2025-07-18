"auto";

// ========== 控制台日志封装 ==========
const TAG = "[PPMT]";
function log(msg) {
    console.log(TAG + " " + msg);
}

// ========== 权限检查 ==========

log("已获得悬浮窗权限 ✔");

// ========== 清理旧窗口 ==========
log("关闭旧窗口...");
try { floaty.closeAll(); } catch (e) { log("关闭旧窗口异常：" + e); }

// ========== 屏幕信息 ==========
const sw = device.width;
const sh = device.height;
log("屏幕尺寸: " + sw + " × " + sh);

// ========== 创建悬浮窗 ==========
log("创建悬浮窗...");
let win = floaty.window(
    <frame id="root" bg="#01000000">
        <vertical>
            {/* 可拖动标题 */}
            <text id="drag"
                  text="ppmt抢购助手"
                  textSize="16sp"
                  textColor="#FFFFFF"
                  bg="#CC000000"
                  padding="8"
                  gravity="center"
                  w="*"/>
            {/* 内容区 */}
            <vertical bg="#80000000" padding="10 5 10 10">
                <horizontal>
                    <button id="pause" text="暂停" layout_weight="1" textColor="#FFFFFF" bg="#80FF5722"/>
                    <button id="restart" text="重启" layout_weight="1" textColor="#FFFFFF" bg="#804CAF50"/>
                    <button id="btnClose" text="关闭" layout_weight="1" textColor="#FFFFFF" bg="#80808080"/>
                </horizontal>

                <text text="选择模式" textSize="14sp" textColor="#FFFFFF" marginTop="8"/>
                <radiogroup id="mode" orientation="horizontal">
                    <radio id="normal" text="正常" textColor="#FFFFFF" checked="true"/>
                    <radio id="crazy" text="狂暴" textColor="#FFFFFF"/>
                </radiogroup>

                <text text="选择数量" textSize="14sp" textColor="#FFFFFF" marginTop="8"/>
                <radiogroup id="count" orientation="horizontal">
                    <radio id="one" text="1" textColor="#FFFFFF" checked="true"/>
                    <radio id="two" text="2" textColor="#FFFFFF"/>
                </radiogroup>

                <text text="刷新速度" textSize="14sp" textColor="#FFFFFF" marginTop="8"/>
                <seekbar id="speed" max="1000" progress="200" progressTint="#2196F3"/>
                <text id="speedText" text="200 ms" textSize="12sp" textColor="#CCCCCC" marginTop="3"/>
                <text id="status" text="状态：准备中…" textSize="14sp" textColor="#2196F3" marginTop="8"/>
            </vertical>
        </vertical>
    </frame>
);
log("悬浮窗对象已创建 ✔");

// ========== 初始位置 ==========
win.setPosition(0, 200);
log("初始位置已设置 ✔");
log("win.count: " + win.count);
log("win.speed: " + win.speed);

// ========== 自适应尺寸 ==========
ui.post(() => {
    const w = win.getWidth();
    const h = win.getHeight();
    win.setSize(w, h);
    log("自适应尺寸完成: " + w + " × " + h);
});

// ========== 拖动实现（带日志） ==========
let downX, downY, dx, dy;
win.drag.setOnTouchListener(function (v, e) {
    switch (e.getAction()) {
        case e.ACTION_DOWN:
            downX = e.getRawX();
            downY = e.getRawY();
            dx = win.getX();
            dy = win.getY();
            log("拖动开始: down(" + downX + "," + downY + ")");
            return true;
        case e.ACTION_MOVE:
            const newX = dx + (e.getRawX() - downX);
            const newY = dy + (e.getRawY() - downY);
            win.setPosition(newX, newY);
            return true;
        case e.ACTION_UP:
            log("拖动结束: 当前坐标(" + win.getX() + "," + win.getY() + ")");
            return true;
    }
    return false;
});

// ========== 事件绑定（带日志） ==========
// 保存上一次的选中id和滑块进度
let lastCountId = win.count.getCheckedRadioButtonId();
let lastModeId = win.mode.getCheckedRadioButtonId();
let lastSpeed = win.speed.getProgress();

setInterval(() => {
    // 检查数量单选框
    let currentCountId = win.count.getCheckedRadioButtonId();
    if (currentCountId !== lastCountId) {
        lastCountId = currentCountId;
        if (currentCountId == win.one.id) {
            log("数量切换 → 1");
            toast("已选择数量：1");
        } else if (currentCountId == win.two.id) {
            log("数量切换 → 2");
            toast("已选择数量：2");
            loopClickQueding();
        } else {
            log("数量切换 → 未知");
        }
    }
    // 检查模式单选框
    let currentModeId = win.mode.getCheckedRadioButtonId();
    if (currentModeId !== lastModeId) {
        lastModeId = currentModeId;
        if (currentModeId == win.normal.id) {
            log("模式切换 → 正常");
            toast("已选择模式：正常");
        } else if (currentModeId == win.crazy.id) {
            log("模式切换 → 狂暴");
            toast("已选择模式：狂暴");
        } else {
            log("模式切换 → 未知");
        }
    }
    // 检查滑块
    let currentSpeed = win.speed.getProgress();
    if (currentSpeed !== lastSpeed) {
        lastSpeed = currentSpeed;
        win.speedText.setText(currentSpeed + " ms");
        log("速度滑块 → " + currentSpeed + " ms");
    }
}, 200); // 每200ms检查一次

// 事件绑定（带日志）只保留按钮相关
win.btnClose.on("click", () => {
    log("点击了【关闭】按钮");
    win.close();
});
win.pause.on("click", () => {
    log("点击了【暂停】按钮");
    win.status.setText("状态：已暂停");
    toast("已暂停");
});
win.restart.on("click", () => {
    log("点击了【重启】按钮");
    win.status.setText("状态：已重启");
    toast("已重启");
});

// // ========== 点击日志图标 ==========
// // 说明：此函数用于点击屏幕指定区域的日志图标，bounds参数请根据实际机型调整
// function clickLogIcon() {
//   try {
//     var selector = bounds(56,2817,1382,2922);
//     if (!selector) {
//       toast('bounds选择器无效');
//       log('bounds选择器无效');
//       return;
//     }
//     var w = selector.findOne(1000); // 最多等1秒
//     if (w) {
//       w.click();
//     } else {
//       toast('没有找到日志图标');
//       log('没有找到日志图标');
//     }
//   } catch (e) {
//     log('clickLogIcon异常: ' + e);
//   }
// }


// ========== 点击其它图标 ==========
// 说明：此函数用于点击屏幕指定区域的其它图标，bounds参数请根据实际机型调整
function clickQuedingIcon() {
  try {
    var selector = text("确定");
    if (!selector) {
      toast('bounds选择器无效'); 
      log('bounds选择器无效');
      return false;
    }
    var ws = selector.findOne(1000); // 最多等1秒
    if (ws) {
      ws.click();
      log('成功点击确定按钮');
      return true;
    } else {
      toast('没有找到确定按钮');
      log('没有找到确定按钮');
      return false;
    }
  } catch (e) {
    log('clickQuedingIcon异常: ' + e);
    return false;
  }
}

// ========== 广播刷新函数 =========
// 说明：通过发送系统广播尝试刷新页面，action 需根据实际APP调整
function tryBroadcastRefresh() {
    let actions = [
        // 示例action，需替换为目标APP实际支持的广播
        'com.example.app.ACTION_REFRESH',
        'android.net.conn.CONNECTIVITY_CHANGE'
    ];
    actions.forEach(action => {
        log('尝试发送广播: ' + action);
        try {
            shell('am broadcast -a ' + action, true);
        } catch (e) {
            log('发送广播异常: ' + e);
        }
        sleep(1000);
    });
}

// 交替点击“送到家”和“到店取”按钮
let lastDeliveryType = null;
function alternateDeliveryType() {
    let btn1 = text("送到家").findOne(500);
    if (btn1) {
        btn1.click();
        log("已点击 送到家");
        sleep(200); // 可根据实际情况调整
        if (clickQuedingIcon()) {
            log("送到家后确定按钮点击成功");
            return true;
        }
    }
    let btn2 = text("到店取").findOne(500);
    if (btn2) {
        btn2.click();
        log("已点击 到店取");
        sleep(200); // 可根据实际情况调整
        if (clickQuedingIcon()) {
            log("到店取后确定按钮点击成功");
            return true;
        }
    }
    return false;
}

// ========== 循环点击确定按钮 ==========
// 说明：持续尝试点击确定按钮，失败时刷新页面重试
let isLooping = false;
let refreshCount = 0; // 新增刷新次数变量
function loopClickQueding() {
    if (isLooping) {
        log("循环已在进行中，跳过重复启动");
        return;
    }
    isLooping = true;
    refreshCount = 0; // 启动时重置刷新次数
    log("开始循环点击确定按钮");
    win.status.setText("状态：已刷新" + refreshCount + "次"); // 初始显示

    function tryClick() {
        if (clickQuedingIcon()) {
            log("确定按钮点击成功，停止循环");
            isLooping = false;
            win.status.setText("状态：已成功"); // 成功时显示
            refreshCount = 0;
            return;
        } else if (alternateDeliveryType()) {
            log("交替点击后确定按钮点击成功，停止循环");
            isLooping = false;
            win.status.setText("状态：已成功"); // 成功时显示
            refreshCount = 0;
            return;
        } else {
            refreshCount++;
            win.status.setText("状态：已刷新" + refreshCount + "次"); // 实时更新
            log("点击失败，交替点击送到家/到店取后重试");
            setTimeout(tryClick, 500); // 间隔可根据实际情况调整
        }
    }
    tryClick();
}

// ========== 启动循环点击（可选） ==========
// 如果需要自动启动，取消下面这行的注释
// loopClickQueding();

// ========== 保活 ==========
setInterval(() => {}, 1000);
log("脚本初始化全部完成 ✔");