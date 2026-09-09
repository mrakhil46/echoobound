export const keys = Object.create(null);

export const mouse = {
    screenX: 0,
    screenY: 0,
    worldX: 0,
    worldY: 0,
    down: false,
    inside: false
};

export const mobile = {
    moveX: 0,
    moveY: 0,
    aimX: 0,
    aimY: 0,
    fire: false,
    jump: false
};

export function initInput(canvas, camera, crosshair, handlers) {
    window.addEventListener("keydown", e => {
        keys[e.code] = true;
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
            e.preventDefault();
        }
        if (e.code === "KeyQ" && handlers.onSwitchWeapon) handlers.onSwitchWeapon();
        if (e.code === "KeyE" && handlers.onEcho) handlers.onEcho();
        if (e.code === "KeyR" && handlers.onRestart) handlers.onRestart();
        if (e.code === "Enter" && handlers.onEnter) handlers.onEnter();
    });

    window.addEventListener("keyup", e => {
        keys[e.code] = false;
    });

    function updateMousePosition(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.screenX = (e.clientX - rect.left) * (canvas.width / (window.devicePixelRatio || 1) / rect.width);
        mouse.screenY = (e.clientY - rect.top) * (canvas.height / (window.devicePixelRatio || 1) / rect.height);
        mouse.worldX = mouse.screenX + camera.x;
        mouse.worldY = mouse.screenY + camera.y;

        crosshair.style.left = e.clientX + "px";
        crosshair.style.top = e.clientY + "px";
    }

    canvas.addEventListener("mousemove", updateMousePosition);
    canvas.addEventListener("mouseenter", e => {
        mouse.inside = true;
        crosshair.style.display = "block";
        updateMousePosition(e);
    });
    canvas.addEventListener("mouseleave", () => {
        mouse.inside = false;
        crosshair.style.display = "none";
    });

    window.addEventListener("mousedown", e => {
        if (e.button === 0) mouse.down = true;
    });
    window.addEventListener("mouseup", e => {
        if (e.button === 0) mouse.down = false;
    });

    window.addEventListener("blur", () => {
        mouse.down = false;
        for (const k in keys) keys[k] = false;
    });

    setupJoystick(document.getElementById("movePad"), document.getElementById("moveKnob"), (x, y) => {
        mobile.moveX = x;
        mobile.moveY = y;
    });

    setupJoystick(document.getElementById("aimPad"), document.getElementById("aimKnob"), (x, y) => {
        mobile.aimX = x;
        mobile.aimY = y;
    });

    mobileButton("jumpBtn", () => (mobile.jump = true), () => (mobile.jump = false));
    mobileButton("fireBtn", () => (mobile.fire = true), () => (mobile.fire = false));

    document.getElementById("weaponBtn").addEventListener("pointerdown", e => {
        e.preventDefault();
        if (handlers.onSwitchWeapon) handlers.onSwitchWeapon();
    });

    document.getElementById("echoBtn").addEventListener("pointerdown", e => {
        e.preventDefault();
        if (handlers.onEcho) handlers.onEcho();
    });
}

function setupJoystick(pad, knob, callback) {
    let active = false;
    let pointerId = null;

    function update(e) {
        const rect = pad.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const max = rect.width * 0.34;
        const len = Math.hypot(dx, dy);

        if (len > max) {
            dx = (dx / len) * max;
            dy = (dy / len) * max;
        }

        knob.style.transform = `translate(${dx}px,${dy}px)`;
        callback(dx / max, dy / max);
    }

    pad.addEventListener("pointerdown", e => {
        active = true;
        pointerId = e.pointerId;
        pad.setPointerCapture(e.pointerId);
        update(e);
    });

    pad.addEventListener("pointermove", e => {
        if (active && e.pointerId === pointerId) update(e);
    });

    function release() {
        active = false;
        pointerId = null;
        knob.style.transform = "translate(0,0)";
        callback(0, 0);
    }

    pad.addEventListener("pointerup", release);
    pad.addEventListener("pointercancel", release);
    pad.addEventListener("lostpointercapture", release);
}

function mobileButton(id, down, up) {
    const el = document.getElementById(id);
    el.addEventListener("pointerdown", e => {
        e.preventDefault();
        down();
    });
    el.addEventListener("pointerup", e => {
        e.preventDefault();
        up();
    });
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
}