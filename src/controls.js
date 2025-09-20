export const keys = {
    w: false,
    s: false,
    a: false,
    d: false,
};

export function setupKeyControls() {
    window.addEventListener('keydown', (event) => {
        if (keys[event.key.toLowerCase()] !== undefined) {
            keys[event.key.toLowerCase()] = true;
        }
    });

    window.addEventListener('keyup', (event) => {
        if (keys[event.key.toLowerCase()] !== undefined) {
            keys[event.key.toLowerCase()] = false;
        }
    });
}
