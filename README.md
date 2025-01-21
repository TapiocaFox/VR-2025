# NYU-FRL-XR

Software for NYU Future Reality Lab webXR-based XR experience.

# How to setup the environment

install Node.js and npm if you haven't. Then in the command line, do
```sh
npm install
cd server
npm install
./patch.sh
```

# How to run on your local computer

1. At the root folder, do ``./startserver``
2. Go to chrome://flags/ in your Google Chrome browser
3. Search: ***"Insecure origins treated as secure"*** and enable the flag
4. Add http://[your-computer's-ip-address]:2024 to the text box. For example http://10.19.127.1:2024
5. Relaunch the chrome browser on your computer and go to http://localhost:2024

# How to run in VR

1. Run the program locally on your computer
2. Open the browser on your VR headset
3. Go to chrome://flags/
4. Search: ***"Insecure origins treated as secure"*** and enable the flag
5. Add http://[your-computer's-ip-address]:2024 to the text box. For example http://10.19.127.1:2024
7. Relaunch the browser on your VR headset and go to http://[your-computer's-ip-address]:2024 

# How to debug in VR

1. On your Oculus app, go to *Devices*, select your headset from the device list, and wait for it to connect. Then select *Developer Mode* and turn on *Developer Mode*.
2. Connect your quest with your computer using your Oculus Quest cable.
3. Go to chrome://inspect#devices on your computer
4. Go to your VR headset and accept *Allow USB Debugging* when prompted on the headset
5. On the chrome://inspect#devices on your computer, you should be able to see your device under the *Remote Target* and its active programs. You can then inspect the *NYU-FRL-XR* window on your computer.

# How to enable your hand-tracking

1. Enable the experimental feature in the browser (Oculus Browser 11)
2. Visit chrome://flags/
3. Enable WebXR experiences with joint tracking (#webxr-hands)
4. Enable WebXR Layers depth sorting (#webxr-depth-sorting)
5. Enable WebXR Layers (#webxr-layers)
6. Enable phase sync support (#webxr-phase-sync)
7. Enable "Auto Enable Hands or Controllers" (Quest Settings (Gear Icon) -> Device -> Hands and Controllers)
8. Enter the VR experience
