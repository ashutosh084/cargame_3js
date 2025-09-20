export let debugBox, speedometer, speedBars = [], speedText, steeringWheel;
export const numberOfBars = 20;

export function initUI() {
    if (import.meta.env.VITE_ENV === 'local') {
        debugBox = document.createElement('div');
        debugBox.style.position = 'absolute';
        debugBox.style.top = '10px';
        debugBox.style.left = '10px';
        debugBox.style.padding = '10px';
        debugBox.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        debugBox.style.color = 'white';
        debugBox.style.fontFamily = 'monospace';
        document.body.appendChild(debugBox);

        const title = document.createElement('h3');
        title.innerText = 'Debug Params';
        title.style.margin = '0 0 10px 0';
        title.style.padding = '0';
        debugBox.appendChild(title);
    }

    speedometer = document.createElement('div');
    speedometer.style.position = 'absolute';
    speedometer.style.bottom = '10px';
    speedometer.style.left = '10px';
    speedometer.style.display = 'flex';
    speedometer.style.alignItems = 'flex-end';
    document.body.appendChild(speedometer);

    for (let i = 0; i < numberOfBars; i++) {
        const bar = document.createElement('div');
        bar.style.width = '5px';
        bar.style.height = `${5 + i * 2}px`;
        bar.style.backgroundColor = 'grey';
        bar.style.marginRight = '2px';
        speedometer.appendChild(bar);
        speedBars.push(bar);
    }

    speedText = document.createElement('div');
    speedText.style.color = 'white';
    speedText.style.fontFamily = 'monospace';
    speedText.style.fontSize = '24px';
    speedText.style.marginLeft = '10px';
    speedometer.appendChild(speedText);

    steeringWheel = document.createElement('img');
    steeringWheel.src = 'assets/steering.png';
    steeringWheel.style.position = 'absolute';
    steeringWheel.style.bottom = '80px';
    steeringWheel.style.left = '10px';
    steeringWheel.style.width = '80px';
    steeringWheel.style.height = '80px';
    document.body.appendChild(steeringWheel);
}
