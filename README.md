Tomato
======

Designed for 30-minutes [Pomodoro technique](https://en.wikipedia.org/wiki/Pomodoro_Technique).
Stay focused with brain sensing headband.


Principle
---------

A certain frequency range of brain waves is known as being related to the mental concentration.


Preparation
-----------

Download SDK at [developer.choosemuse.com](http://developer.choosemuse.com/research-tools).
Tested on Ubuntu 14.04 64-bit.

```
$ sudo apt-get install libbluetooth3:i386
$ pip install tornado pyliblo

$ wget https://storage.googleapis.com/ix_downloads/musesdk-3.4.1/musesdk-3.4.1-linux-installer.run
$ chmod +x musesdk-3.4.1-linux-installer.run
$ ./musesdk-3.4.1-linux-installer.run

$ muse-io --help
```


Run
---

Pair devices over bluetooth first.

```
$ muse-io --device <YOUR_MUSE_MAC_ADDRESS> --osc osc.udp://localhost:5000
$ python app.py --app_port=8000 --osc_port=5000
```


Screenshot
----------

![](https://raw.githubusercontent.com/elnn/tomato/master/screenshot.png)
